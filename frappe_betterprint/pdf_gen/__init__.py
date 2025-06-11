import os
import io
import re
import json

import requests
from pypdf import PdfReader, PdfWriter

import frappe
from frappe.utils import get_url
import frappe_betterprint.pdf_gen.utils as pdf_gen_utils
from frappe_betterprint.pdf_renderer import start_server, check_server_status


def get_betterprint_pdf(html, options=None, output: PdfWriter | None = None):
    """Will generate betterprint pdf file using chrome"""
    pdf_file_path = os.path.abspath(f"/tmp/{frappe.generate_hash()}.pdf")
    start_server()

    page_size = pdf_gen_utils.extract_page_size(options or {})
    if page_size:
        style_element = f"""
        <style>
        .print-format .paginatejs .page {{
            width: {page_size.get("page-width", "210")}mm !important;
            height: {page_size.get("page-height", "297")}mm !important;
        }}
        </style>
        """

        # Use regex to insert before </body>
        html = re.sub(r"\s*</body>\s*", f"{style_element}</body>", html, flags=re.IGNORECASE)

    html = pdf_gen_utils.prepare_html_for_external_use(html)

    if not check_server_status():
        frappe.throw(
            "Betterprint could not be started. Please check if all required dependencies are installed."
        )

    body = {
        "html": html,
        "filepath": pdf_file_path,
        "allow_origin": get_url(),
    }

    body = json.dumps(body)

    response = requests.get(
        "http://127.0.0.1:39584/v1/generate-betterprint-pdf",
        data=body,
        headers={"content-type": "application/json"},
        timeout=15,
    )
    if response.status_code != 200:
        frappe.throw("PDF generation failed. Invalid status code from betterprint_server")

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
