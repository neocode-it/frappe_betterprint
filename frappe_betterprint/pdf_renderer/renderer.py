import re
import argparse

from playwright.sync_api import sync_playwright
from urllib.parse import urlparse


def render_pdf(html, filepath, origin) -> dict:
    """
    Generates a PDF from HTML content, waiting for a custom event or timeout.
    """
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page()

            # Extract domain from origin URL
            parsed_url = urlparse(origin)
            full_domain = parsed_url.netloc
            domain = full_domain.split(":")[0]  # Remove the port if present

            # # Ignore CORS for this domain
            # # Workaround for: Chrome will always block CORS for local html files
            playwright_add_cors_allow_route(page, domain)

            # Add HTML content
            page.set_content(html)

            # Wait for the custom event indicating completion
            page.evaluate("""
                document.addEventListener('betterPrintFinished', () => {
                    window.betterPrintFinished = true;
                });
            """)

            # page.wait_for_function("window.betterPrintFinished === true", timeout=30000)

            # Get page dimensions
            dimensions = page.evaluate("""
                () => {
                    const page = document.querySelector(".paginatejs-pages .page");
                    const style = getComputedStyle(page);
                    return { "width": style.width, "height": style.height };
                }
            """)

            # dimensions = {}

            # dimensions["width"] = "210mm"
            # dimensions["height"] = "297mm"

            # Generate PDF
            page.pdf(
                width=dimensions["width"],
                height=dimensions["height"],
                path=filepath,
                print_background=True,
            )

            browser.close()
        return {"status": "success", "filepath": filepath}

    except Exception as e:
        return {"status": "error", "message": str(e)}


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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate PDF from HTML using Playwright."
    )
    parser.add_argument(
        "html", type=str, help="HTML content as a string or path to an HTML file"
    )
    parser.add_argument("filepath", type=str, help="Path to save the generated PDF")
    parser.add_argument("origin", type=str, help="Origin URL for CORS handling")

    args = parser.parse_args()

    # Read HTML from file if provided as a path
    if args.html.endswith(".html"):
        with open(args.html, "r", encoding="utf-8") as f:
            args.html = f.read()

    render_pdf(args.html, args.filepath, args.origin)
