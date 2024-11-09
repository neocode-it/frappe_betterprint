__version__ = "0.0.1"

import frappe
from frappe.utils.pdf import get_pdf, pdf_body_html
import frappe_betterprint.utils.pdf as pdf_utils


def inject_body_html(template, print_format=None, args=None, **kwargs):
    """Check if print format is betterprint enabled and injects additional content"""

    # Return default content if betterprint is disabled for this print format
    if not print_format or not print_format.generate_pdf_by_betterprint:
        return pdf_body_html(template, args, **kwargs)

    # Betterprint dict, which will be accessible as context variable
    betterint = {
        "print_format_name": print_format.name,
    }

    # Inject betterprint as context variable within jinja env
    args.update({"betterprint": betterint})

    # Render jinja
    html = pdf_body_html(template, args, **kwargs)

    # Inject print format name into html body content
    return pdf_utils.html_inject_print_format(html, print_format.name)


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

    # PDF size not specifically declared? Use betterprint page size setting.
    if not options.get("page-size"):
        options["page-size"] = frappe.db.get_value(
            "Print Format", print_format, "betterprint_pdf_page_size"
        )

    return pdf_utils.get_betterprint_pdf(html, options, *args, **kwargs)


frappe.utils.pdf.get_pdf = pdf
