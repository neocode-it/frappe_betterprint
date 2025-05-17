import os
import re
import io
import subprocess
import sys
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

    playwright = None
    browser = None
    page = None

    # Nested try-catch to differentiate browser related exceptions from content/pdf-related issues
    try:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch()

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
        frappe.throw(
            "Frappe Betterprint couldn't launch the print process. "
            "Please check if all required dependencies are installed on this system"
        )
        return False
    finally:
        if browser:
            browser.close()
        playwright.stop()


def log(message):
    """
    Log a message to the console.
    """
    import time

    time.time()
    with open("frappe_betterprint.log", "a") as log_file:
        # log with timestamp including ms
        log_file.write(
            f"{time.strftime('%H:%M:%S')}:{int(time.time() * 1000) % 1000:03d} - {message}\n"
        )


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

    pdf_file_path = os.path.abspath(f"/tmp/{frappe.generate_hash()}.pdf")

    html = pdf_gen_utils.prepare_html_for_external_use(html)

    config = frappe.get_common_site_config()
    print_setup = config.get("print_setup", "internal")

    if print_setup == "external":
        render_external(html, pdf_file_path, get_url())
    elif print_setup == "internal":
        render_internal(html, pdf_file_path, get_url())
    elif print_setup == "server":
        render_server(html, pdf_file_path, get_url())
    else:
        raise ValueError(
            f"Invalid print setup '{print_setup}'. Expected 'external' or 'internal'."
        )

    pdf_content = None

    with open(pdf_file_path, "rb") as f:
        pdf_content = f.read()
        os.remove(pdf_file_path)

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

    return filedata


def render_external(html, filepath, origin):
    script_directory = os.path.dirname(os.path.abspath(__file__))
    parent_directory = os.path.dirname(script_directory)

    script_path = os.path.join(parent_directory, "pdf_renderer", "renderer.py")

    import time

    start = time.time()
    subprocess.run(
        [sys.executable, script_path, html, filepath, origin],
        cwd=os.path.dirname(script_path),
    )
    log(f"Time taken to run subprocess(external): {time.time() - start} seconds")


def render_internal(html, filepath, origin):
    from frappe_betterprint.pdf_renderer import renderer

    import time

    start = time.time()

    render_pdf(html, filepath, origin)
    log(f"Time taken to run in-frappe print(internal): {time.time() - start} seconds")


def render_server(html, filepath, origin):
    """
    Will generate betterprint pdf file using betterprint server
    Returns the pdf content
    """

    import json
    import requests
    import time

    start = time.time()

    body = {
        "html": html,
        "filepath": filepath,
        "allow_origin": origin,
    }

    body = json.dumps(body)

    response = requests.get(
        "http://debian:39584/v1/generate-betterprint-pdf",
        data=body,
        headers={"content-type": "application/json"},
        timeout=15,
    )
    if response.status_code != 200:
        frappe.throw(
            "PDF generation failed. Invalid status code from betterprint_server"
        )

    log(f"Time taken to run server print(server): {time.time() - start} seconds")
    return
