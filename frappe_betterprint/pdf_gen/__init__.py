import os
import re
import io
from pypdf import PdfReader, PdfWriter
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse


import frappe
from frappe.utils import get_url

import frappe_betterprint.pdf_gen.utils as pdf_gen_utils


def get_betterprint_pdf(html, options=None, output: PdfWriter | None = None):
    """Will generate betterprint pdf file using chrome"""
    betterprint_server.prelaunch_server()

    if not options:
        options = {}

    # TODO: Implement page size if set in options
    page_size = pdf_gen_utils.prepare_page_size(options)

    pdf_file_path = os.path.abspath(f"/tmp/{frappe.generate_hash()}.pdf")

    html = pdf_gen_utils.prepare_html_for_external_use(html)

    body = {
        "html": html,
        "filepath": pdf_file_path,
    }

    body = json.dumps(body)

    betterprint_server.wait_for_ready()

    response = requests.get(
        "http://192.168.1.108:3333/v1/generate-betterprint-pdf",
        data=body,
        headers={"content-type": "application/json"},
        timeout=15,
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

    filedata = pdf_gen_utils.get_file_data_from_writer(writer)

    return filedata
