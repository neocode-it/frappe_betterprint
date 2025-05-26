import os
import io
from pypdf import PdfReader, PdfWriter

import frappe
from frappe.utils import get_url

import frappe_betterprint.pdf_gen.utils as pdf_gen_utils


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
    file_path = "/home/frappe/frappe-bench/sites/" + filename

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
