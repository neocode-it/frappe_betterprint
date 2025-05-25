import threading
import time
import queue
import re
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def launch_worker_thread(global_queue):
    threading.Thread(target=worker_thread, daemon=True, args=(global_queue,)).start()


def worker_thread(q):
    # Nested try-catch to try-close playwright after every attempt.
    # If that fails too, theres a backup try-catch
    playwright = None
    browser = None
    task = None

    try:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch()
        while True:
            try:
                task = q.get_task()

                result = manage_task(task, browser)
                if result is None:
                    result = {"error": True, "content": "Missing response from worker"}

                result = {"error": False, "content": "", **result}
                q.task_done(task, result)

            except queue.Empty:
                time.sleep(0.2)

    except Exception as _:
        print("Exception occurred in Workerthread. Gathering log data and restart worker...")

        # Check if there was an interrupt within an ongoing task.
        # If so, terminate task and report error
        if task:  # Ongoing task?
            q.task_done(task, {"error": True, "content": "Error ocurred in workerthread"})

        # Throw exception to signal an issue for the worker_backbone
        raise Exception("Important! Required to signal worker_backbone there went something wrong")
    finally:
        # Try to close browser and playwright if they are initialized.
        # Might fail too, depending on the exception.
        if browser:
            browser.close()
        if playwright:
            playwright.stop()


def manage_task(task, browser):
    if task["command"] == "generate-betterprint-pdf":
        return generate_betterprint_pdf(task, browser)

    else:
        return {"error": True, "description": "WORKER ERROR: Command not found"}


def generate_betterprint_pdf(task: dict, browser) -> dict:
    """
    Generates a PDF from HTML content, waiting for a custom event or timeout.
    """

    # TODO: Implement page size (Maybe first complete frappes-app implementation?)
    # TODO: Implement CORS with proper regex
    # TODO: Implement Browser/Pagedjs error handling and return in case of exceptions

    page = browser.new_page()

    # # Convert origin url into origin domain
    parsed_url = urlparse(task["allow_origin"])
    full_domain = parsed_url.netloc
    domain = full_domain.split(":")[0]  # Remove the port if present

    # # Ignore CORS for this domain
    # # Workaround for: Chrome will always block CORS for local html files
    playwright_add_cors_allow_route(page, domain)

    # Add page content
    page.set_content(task["html"])

    try:
        # Wait for the "betterPrintFinished" event with a timeout of 30 seconds (30000 ms)
        page.evaluate("""
            document.addEventListener('betterPrintFinished', () => {
                window.betterPrintFinished = true;
            });
        """)

        page.wait_for_function("window.betterPrintFinished === true", timeout=30000)

        dimensions = page.evaluate("""() => {
            const page = document.querySelector(".paginatejs-pages .page");
            const style = getComputedStyle(page);
            const width = style.width;
            const height = style.height;
            return {"width": width, "height": height};
            }
        """)
    except Exception:
        return {
            "content": "failed",
            "error": "Unknown failure printing PDF",
        }

    # page.pdf(width=page_width, height=page_height, path=task["filepath"])
    page.pdf(
        width=dimensions["width"],
        height=dimensions["height"],
        path=task["filepath"],
        print_background=True,
    )

    return {"content": "successful"}


def playwright_add_cors_allow_route(page, allow_domain):
    domain_pattern = rf"^https?://{re.escape(allow_domain)}(:[0-9]+)?(/|$)"
    page.route(re.compile(domain_pattern), lambda route: _playwright_cors_unset(route))


def _playwright_cors_unset(route):
    try:
        response = route.fetch()
        headers = response.headers.copy()
        headers["Access-Control-Allow-Origin"] = "*"
        route.fulfill(status=response.status, headers=headers, body=response.body())
    except Exception as _:
        route.continue_()
