import frappe_betterprint.utils.server as betterprint_server
from frappe_betterprint.utils.print import prepare_html_for_external_use
import frappe
import os
import io
import json
import requests
from pypdf import PdfReader, PdfWriter


def get_betterprint_pdf(html, options=None, output: PdfWriter | None = None):
    """Will generate betterprint pdf file using chrome"""
    betterprint_server.prelaunch_server()

    if not options:
        options = {}

    page_size = prepare_page_size(options)

    pdf_file_path = os.path.abspath(f"/tmp/{frappe.generate_hash()}.pdf")

    html = prepare_html_for_external_use(html)

    body = {
        "html": html,  # scrub_urls(html),
        "filepath": pdf_file_path,
        **page_size,
    }

    body = json.dumps(body)

    betterprint_server.wait_for_ready()

    response = requests.get(
        "http://127.0.0.1:39584/v1/generate-pdf",
        data=body,
        headers={"content-type": "application/json"},
        timeout=10,
    )
    if response.status_code != 200:
        frappe.throw(
            "PDF generation failed. Invalid status code from betterprint_server"
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

    filedata = get_file_data_from_writer(writer)

    return filedata


def get_file_data_from_writer(writer_obj):
    # https://docs.python.org/3/library/io.html
    stream = io.BytesIO()
    writer_obj.write(stream)

    # Change the stream position to start of the stream
    stream.seek(0)

    # Read up to size bytes from the object and return them
    return stream.read()


def prepare_page_size(options: str) -> dict:
    """Validates the page size and return it's dimensions"""
    page_size = options.get("page-size")

    # Custom print size
    if options.get("page-height") and options.get("page-width"):
        return {
            "page-width": options["page-width"],
            "page-height": options["page-height"],
        }

    else:
        return page_dimensions.get(page_size, page_dimensions["A4"])


def html_inject_print_format(html: str, print_format: str) -> str:
    """Will inject print format name hidden into the html content"""
    import html as html_lib

    val = f'<!--bp-format="{html_lib.escape(print_format)}"-->'
    return val + html


def html_extract_print_format(html: str) -> str | None:
    """Extracts print format name from html content"""
    import re

    match = re.search(r'<!--bp-format="(.*?)"-->', html)
    if match:
        return match.group(1)


page_dimensions = {
    "A0": {"page-height": 1189, "page-width": 841},
    "A1": {"page-height": 841, "page-width": 594},
    "A2": {"page-height": 594, "page-width": 420},
    "A3": {"page-height": 420, "page-width": 297},
    "A4": {"page-height": 297, "page-width": 210},
    "A5": {"page-height": 210, "page-width": 148},
    "A6": {"page-height": 148, "page-width": 105},
    "A7": {"page-height": 105, "page-width": 74},
    "A8": {"page-height": 74, "page-width": 52},
    "A9": {"page-height": 52, "page-width": 37},
    "B0": {"page-height": 1414, "page-width": 1000},
    "B1": {"page-height": 1000, "page-width": 707},
    "B2": {"page-height": 707, "page-width": 500},
    "B3": {"page-height": 500, "page-width": 353},
    "B4": {"page-height": 353, "page-width": 250},
    "B5": {"page-height": 250, "page-width": 176},
    "B6": {"page-height": 176, "page-width": 125},
    "B7": {"page-height": 125, "page-width": 88},
    "B8": {"page-height": 88, "page-width": 62},
    "B9": {"page-height": 62, "page-width": 44},
    "B10": {"page-height": 44, "page-width": 31},
    "C5E": {"page-height": 229, "page-width": 163},
    "Comm10E": {"page-height": 241, "page-width": 105},
    "DLE": {"page-height": 220, "page-width": 110},
    "Executive": {"page-height": 254, "page-width": 291},
    "Folio": {"page-height": 330, "page-width": 210},
    "Ledger": {"page-height": 432, "page-width": 279},
    "Legal": {"page-height": 356, "page-width": 216},
    "Letter": {"page-height": 279, "page-width": 216},
    "Tabloid": {"page-height": 432, "page-width": 279},
}
