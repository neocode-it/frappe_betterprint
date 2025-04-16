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

    betterprint_script = (
        '<script src="/assets/frappe_betterprint/js/print.js"></script>'
    )
    pagedjs_script = '<script src="/assets/frappe_betterprint/js/pagedjs.js"></script>'
    if print_format.generate_pdf_by_betterprint:
        return (
            f"<template data-ref='pagedjs-content' class='betterprint-content'>{content}</template>"
            + pagedjs_script
            + betterprint_script
        )

    return content


frappe.www.printview.get_rendered_template = get_betterprint_template


betterprint_local = frappe.local.betterprint = dict()


def inject_body_html(template, print_format=None, args=None, **kwargs):
    """Check if print format is betterprint enabled and injects additional content"""

    # Return default content if betterprint is disabled for this print format
    if not print_format or not print_format.generate_pdf_by_betterprint:
        return pdf_body_html(template, args, **kwargs)

    # Betterprint dict, which will be accessible as context variable
    betterprint = {
        "print_format_name": print_format.name,
    }

    # Inject betterprint as context variable within jinja env
    args.update({"betterprint": betterprint})

    # Render jinja
    html = pdf_body_html(template, args, **kwargs)

    # Unset default preview styles by overriding css variable of the print_format
    # Luckily, doc.save() won't ever be called, which allows this nice approach
    #
    # Fixes frappe issue: https://github.com/frappe/frappe/issues/27965
    if print_format.custom_format:
        if not print_format.css:
            print_format.css = ""
        print_format.css = unset_default_style + print_format.css

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
