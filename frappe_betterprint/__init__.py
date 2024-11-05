__version__ = "0.0.1"
import frappe
from frappe import get_print

def my_get_print(
    doctype=None,
    name=None,
    print_format=None,
    style=None,
    as_pdf=False,
    doc=None,
    output=None,
    no_letterhead=0,
    password=None,
    pdf_options=None,
    *args,
    **kwargs,
):
    # Add betterprint pdf options
    if as_pdf and print_format:
        betterprint_enabled = frappe.db.get_value(
            "Print Format", print_format, "generate_pdf_by_betterprint"
        )

        if not pdf_options:
            pdf_options = {}

        # Add entry to enable betterprint for this print
        if betterprint_enabled:
            pdf_options["betterprint_enabled"] = betterprint_enabled

        # PDF size not specifically declared? Use betterprint setting.
        if betterprint_enabled and not pdf_options.get("page-size"):
            pdf_options["page-size"] = betterprint_enabled = frappe.db.get_value(
                "Print Format", print_format, "betterprint_pdf_page_size"
            )

    # Call parent function
    return get_print(
        doctype,
        name,
        print_format,
        style,
        as_pdf,
        doc,
        output,
        no_letterhead,
        password,
        pdf_options,
        *args,
        **kwargs,
    )


frappe.get_print = my_get_print
