import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def after_install():
    create_custom_fields(fields)


def before_uninstall():
    delete_custom_fields(fields)


def delete_custom_fields(custom_fields):
    """
    :param custom_fields: a dict like `{'doctype': [{fieldname: 'test', ...}]}`
    """

    for doctypes, fields in custom_fields.items():
        if isinstance(fields, dict):
            # only one field
            fields = [fields]

        if isinstance(doctypes, str):
            # only one doctype
            doctypes = (doctypes,)

        for doctype in doctypes:
            frappe.db.delete(
                "Custom Field",
                {
                    "fieldname": ("in", [field["fieldname"] for field in fields]),
                    "dt": doctype,
                },
            )

            frappe.clear_cache(doctype=doctype)


fields = {
    "Print Format": [
        {
            "fieldname": "generate_pdf_by_betterprint",
            "label": "Generate PDF using Frappe Betterprint",
            "fieldtype": "Check",
            "depends_on": "custom_format",
            "default": "0",
            "insert_after": "custom_format",
        },
        {
            "fieldname": "betterprint_pdf_page_size",
            "label": "Betterprint PDF Page Size",
            "fieldtype": "Select",
            "options": "A0\nA1\nA2\nA3\nA4\nA5\nA6\nA7\nA8\nA9\nB0\nB1\nB2\nB3\nB4\nB5\nB6\nB7\nB8\nB9\nB10\nC5E\nComm10E\nDLE\nExecutive\nFolio\nLedger\nLegal\nLetter\nTabloid",
            "depends_on": "generate_pdf_by_betterprint",
            "default": "A4",
            "insert_after": "generate_pdf_by_betterprint",
        },
    ]
}
