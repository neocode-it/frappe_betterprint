__version__ = "0.0.1"

import frappe
from frappe.utils.pdf import get_pdf

from frappe.www.printview import get_rendered_template


# Overwriting get rendered body
def get_betterprint_template(
    doc: "Document",
    print_format: str | None = None,
    *args,
    **kwargs,
):
    content = get_rendered_template(doc=doc, print_format=print_format, *args, **kwargs)

    if not print_format.generate_pdf_by_betterprint:
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

    from frappe_betterprint.pdf_gen import html_inject_print_format

    html = html_inject_print_format(html, print_format.name)

    # Unset default preview styles by overriding css variable of the print_format
    # Luckily, doc.save() won't ever be called, which allows this nice approach
    #
    # Fixes frappe issue: https://github.com/frappe/frappe/issues/27965
    if not print_format.css:
        print_format.css = ""
    # print_format.css = unset_default_style + print_format.css

    return html


frappe.www.printview.get_rendered_template = get_betterprint_template


def pdf(html, options=None, *args, **kwargs):
    """Check if print format is betterprint_enabled\n\n
    `enabled`: Selects betterprint pdf generator (using chrome)\n
    `disabled`: Applys default pdf generator (wkhtmltopdf)"""

    from frappe_betterprint.pdf_gen import (
        get_betterprint_pdf,
        html_extract_print_format,
    )

    print_format = html_extract_print_format(html)

    # Not a betterprint format? Return apply get_pdf() function
    if not print_format:
        return get_pdf(html, options=options, *args, **kwargs)

    if not options:
        options = {}

    return get_betterprint_pdf(html, options, *args, **kwargs)


frappe.utils.pdf.get_pdf = pdf


unset_default_style = """
.print-format{
/* Workaround: Print formats will apply default styles from Frappe
    Which won't be applied to prints and Full Page view
    Solution: Revert those Styles coming from Frappe */
    all: unset;
    box-sizing: border-box;
}

.print-format{
 /* Workaround: print format will be set to flex column in js, 
    which won't be applied to prints and Full Page view */
    display: flex;
    flex-direction: column;
    
    padding: 0cm;
    width: 21cm;
    min-height: 27.9cm;
    margin: auto;
    background: white;
}

.print-format, 
.print-format-container,
.print-preview iframe{
    border-radius: 10px;
}

@media print{
    @page{
        margin: 0px;
    }
}
"""
