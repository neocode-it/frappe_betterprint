import os
import re
import io
from pypdf import PdfReader, PdfWriter
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse


import frappe
from frappe.utils import get_url

import frappe_betterprint.pdf_gen.utils as pdf_gen_utils


def render_pdf(html, filepath, origin) -> dict:
    """
    Generates a PDF from HTML content, waiting for a custom event or timeout.
    """

    # bench_path = frappe.utils.get_bench_path() + "/playwright"
    bench_path = frappe.utils.get_site_path() + "/betterprint_browsers"

    # Install browser executables to bench/playwright folder
    # -> Required to share one exec. with all worker in every container
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = bench_path

    playwright = None
    browser = None
    page = None

    # Nested try-catch to differentiate browser related exceptions from content/pdf-related issues
    try:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch()

        try:
            page = browser.new_page()

            # # Convert origin url into origin domain
            parsed_url = urlparse(origin)
            full_domain = parsed_url.netloc
            domain = full_domain.split(":")[0]  # Remove the port if present

            # # Ignore CORS for this domain
            # # Workaround for: Chrome will always block CORS for local html files
            playwright_add_cors_allow_route(page, domain)

            # Add page content
            page.set_content(html)
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

            # page.pdf(width=page_width, height=page_height, path=task["filepath"])
            page.pdf(
                width=dimensions["width"],
                height=dimensions["height"],
                path=filepath,
                print_background=True,
            )
        except Exception as e:
            frappe.throw(f"Unknown exception during PDF-print: {e}")
            return False

    except Exception as e:
        frappe.throw(
            "Frappe Betterprint couldn't launch the print process. "
            "Please check if all required dependencies are installed on this system"
        )
        return False
    finally:
        if browser:
            browser.close()
        playwright.stop()


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


def get_betterprint_pdf(html, options=None, output: PdfWriter | None = None):
    """Will generate betterprint pdf file using chrome"""

    if not options:
        options = {}

    # TODO: Implement page size if set in options
    # page_size = pdf_gen_utils.prepare_page_size(options)

    # pdf_file_path = os.path.abspath(f"/tmp/{frappe.generate_hash()}.pdf")

    html = pdf_gen_utils.prepare_html_for_external_use(html)

    from frappe_betterprint.pdf_gen.chromium import generate_pdf, log

    # pdf_content = generate_pdf(html, get_url())
    # log("PDF generated, content received")

    # render_pdf(html, pdf_file_path, get_url())

    # pdf_content = None

    # with open(pdf_file_path, "rb") as f:
    #     pdf_content = f.read()
    #     os.remove(pdf_file_path)

    pdf_content = get_betterprint_server_pdf(html, get_url())

    reader = PdfReader(io.BytesIO(pdf_content))

    if output:
        output.append_pages_from_reader(reader)
        return output

    writer = PdfWriter()
    writer.append_pages_from_reader(reader)

    if "password" in options:
        password = options["password"]
        writer.encrypt(password)

    filedata = pdf_gen_utils.get_file_data_from_writer(writer)

    log("Return file content")
    print("PDF generated, content received")
    return filedata


def get_betterprint_server_pdf(html, domain):
    """
    Will generate betterprint pdf file using betterprint server
    Returns the pdf content
    """

    import json
    import requests

    filename = frappe.generate_hash() + ".pdf"

    print_path = "/home/" + filename
    file_path = "/workspace/development/frappe-v15/" + filename

    body = {
        "html": html,
        "filepath": print_path,
        "allow_origin": domain,
    }

    body = json.dumps(body)

    response = requests.get(
        "http://debian:39584/v1/generate-betterprint-pdf",
        data=body,
        headers={"content-type": "application/json"},
        timeout=15,
    )
    if response.status_code != 200:
        frappe.throw("PDF generation failed. Invalid status code from betterprint_server")

    pdf_content = None

    with open(file_path, "rb") as f:
        pdf_content = f.read()
        os.remove(file_path)

    return pdf_content
