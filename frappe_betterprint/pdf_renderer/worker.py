import threading
import time
import queue
import re
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


class WorkerThread(threading.Thread):
    def __init__(self, queue):
        super().__init__()
        self.queue = queue
        self.daemon = True
        self.stop_event = threading.Event()

    def stop(self):
        """Public method to stop the thread."""
        self.stop_event.set()  # Signal the thread to stop

    def run(self):
        # Nested try-catch to try-close playwright after every attempt.
        # If that fails too, theres a backup try-catch
        playwright = None
        browser = None
        task = None
        page = None

        try:
            playwright = sync_playwright().start()
            browser = playwright.chromium.launch()
            while not self.stop_event.is_set():
                try:
                    task = self.queue.get_task()

                    if task["command"] == "generate-betterprint-pdf":
                        page = browser.new_page()
                        result = self.generate_betterprint_pdf(task, page)

                    else:
                        result = {"error": True, "description": "WORKER ERROR: Command not found"}

                    # Apply default value if the fields are missing
                    result = {"error": False, "content": "No response from PDF worker", **result}
                    self.queue.task_done(task, result)

                    # Clean up after task completion
                    task = None
                    if page:
                        page.close()
                        page = None

                except queue.Empty:
                    time.sleep(0.1)

        except Exception as e:
            # Check if there was an interrupt within an ongoing task.
            # If so, terminate task and report error
            if task:  # Ongoing task?
                error_details = {
                    "message": f"Error occurred in workerthread: {str(e)}",
                    "type": type(e).__name__,  # Exception type
                    "details": e.args,  # Additional error details
                }

                self.queue.task_done(task, {"error": True, "content": error_details})
            # Keep exception to allow the workerthread to quit & restart
            raise

        finally:
            # Try to close browser and playwright if they are initialized.
            # Might fail too, depending on the exception.
            if browser:
                browser.close()
            if playwright:
                playwright.stop()

    def generate_betterprint_pdf(self, task: dict, page) -> dict:
        """
        Generates a PDF from HTML content, waiting for a custom event or timeout.
        """
        # Convert origin url into origin domain
        parsed_url = urlparse(task["allow_origin"])
        full_domain = parsed_url.netloc
        domain = full_domain.split(":")[0]  # Remove the port if present

        # # Ignore CORS for this domain
        # # Workaround for: Chrome will always block CORS for local html files
        self._playwright_add_cors_allow_route(page, domain)

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
                "content": "Failed to run betterprint script or get the page dimensions",
                "error": True,
            }

        page.pdf(
            width=dimensions["width"],
            height=dimensions["height"],
            path=task["filepath"],
            print_background=True,
        )

        return {"content": "successful"}

    def _playwright_add_cors_allow_route(self, page, allow_domain):
        domain_pattern = rf"^https?://{re.escape(allow_domain)}(:[0-9]+)?(/|$)"
        page.route(re.compile(domain_pattern), lambda route: self._playwright_cors_unset(route))

    def _playwright_cors_unset(self, route):
        try:
            response = route.fetch()
            headers = response.headers.copy()
            headers["Access-Control-Allow-Origin"] = "*"
            route.fulfill(status=response.status, headers=headers, body=response.body())
        except Exception as e:
            route.continue_()
