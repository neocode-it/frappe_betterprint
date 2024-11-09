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
    if options and options.get("betterprint_enabled", False):
        return get_betterprint_pdf(html, options, *args, **kwargs)

    return get_pdf(html, options=options, *args, **kwargs)


frappe.utils.pdf.get_pdf = pdf
