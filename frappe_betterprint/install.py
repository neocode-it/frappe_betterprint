import frappe

from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def after_install():
    # ignore_validate=True is to workaround this issue of print_designer app
    # https://github.com/frappe/print_designer/issues/430
    create_custom_fields(fields, ignore_validate=True)


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
    ]
}
