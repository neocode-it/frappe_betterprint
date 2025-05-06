__version__ = "0.0.1"

import frappe
from frappe.utils.pdf import get_pdf
from frappe.www.printview import get_rendered_template

import frappe_betterprint.pdf_gen.utils as pdf_utils
import frappe_betterprint.pdf_gen


def get_betterprint_template(
    doc: "Document",
    print_format: str | None = None,
    *args,
    **kwargs,
):
    content = get_rendered_template(doc=doc, print_format=print_format, *args, **kwargs)

    if not print_format or not print_format.generate_pdf_by_betterprint:
        return content

    betterprint_script = (
        '<script src="/assets/frappe_betterprint/js/print.js"></script>'
    )
    paginatejs_script = (
        '<script src="/assets/frappe_betterprint/js/paginate.js"></script>'
    )

    html = (
        f"<div style='display: none;' class='betterprint-content'>{content}</div>"
        + paginatejs_script
        + betterprint_script
    )

    html = pdf_utils.html_inject_print_format(html, print_format.name)

    return html


frappe.www.printview.get_rendered_template = get_betterprint_template


def pdf(html, options=None, *args, **kwargs):
    """Check if print format is betterprint_enabled\n\n
    `enabled`: Selects betterprint pdf generator (using chrome)\n
    `disabled`: Applys default pdf generator (wkhtmltopdf)"""

    print_format = pdf_utils.html_extract_print_format(html)

    # Not a betterprint format? Return apply get_pdf() function
    if not print_format:
        return get_pdf(html, options=options, *args, **kwargs)

    if not options:
        options = {}

    return frappe_betterprint.pdf_gen.get_betterprint_pdf(
        html, options, *args, **kwargs
    )


frappe.utils.pdf.get_pdf = pdf
