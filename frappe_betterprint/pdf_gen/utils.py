import io

from frappe.utils.data import expand_relative_urls
from frappe.utils.pdf import inline_private_images
from frappe.utils import get_url


def get_file_data_from_writer(writer_obj):
    # https://docs.python.org/3/library/io.html
    stream = io.BytesIO()
    writer_obj.write(stream)

    # Change the stream position to start of the stream
    stream.seek(0)

    # Read up to size bytes from the object and return them
    return stream.read()


def extract_page_size(options: str) -> dict:
    """Will extract page size from options and return its dimensions in mm if set or None if not set."""
    page_size = options.get("page-size")

    # Custom print size
    if options.get("page-height") and options.get("page-width"):
        return {
            "page-width": options["page-width"],
            "page-height": options["page-height"],
        }

    else:
        return page_dimensions.get(page_size, None)


def html_inject_print_format(html: str, print_format: str) -> str:
    """Will inject print format name hidden into the html content"""
    import html as html_lib

    val = f'<!--bp-format="{html_lib.escape(print_format)}"-->'
    return val + html


def html_extract_print_format(html: str) -> str | None:
    """Extracts print format name from html content"""
    import re

    match = re.search(r'<!--bp-format="(.*?)"-->', html)
    if match:
        return match.group(1)


def prepare_html_for_external_use(html: str) -> str:
    """Expands relative urls and add private images inline"""
    # Expand relative urls to absolute ones
    # Important to add this before inline_private_images
    html = expand_relative_urls(html)

    # Set base url, in case we missed one relative path
    html = f'<base href="{get_url()}">' + html

    # Insert private images
    html = inline_private_images(html)

    return html


page_dimensions = {
    "A0": {"page-height": 1189, "page-width": 841},
    "A1": {"page-height": 841, "page-width": 594},
    "A2": {"page-height": 594, "page-width": 420},
    "A3": {"page-height": 420, "page-width": 297},
    "A4": {"page-height": 297, "page-width": 210},
    "A5": {"page-height": 210, "page-width": 148},
    "A6": {"page-height": 148, "page-width": 105},
    "A7": {"page-height": 105, "page-width": 74},
    "A8": {"page-height": 74, "page-width": 52},
    "A9": {"page-height": 52, "page-width": 37},
    "B0": {"page-height": 1414, "page-width": 1000},
    "B1": {"page-height": 1000, "page-width": 707},
    "B2": {"page-height": 707, "page-width": 500},
    "B3": {"page-height": 500, "page-width": 353},
    "B4": {"page-height": 353, "page-width": 250},
    "B5": {"page-height": 250, "page-width": 176},
    "B6": {"page-height": 176, "page-width": 125},
    "B7": {"page-height": 125, "page-width": 88},
    "B8": {"page-height": 88, "page-width": 62},
    "B9": {"page-height": 62, "page-width": 44},
    "B10": {"page-height": 44, "page-width": 31},
    "C5E": {"page-height": 229, "page-width": 163},
    "Comm10E": {"page-height": 241, "page-width": 105},
    "DLE": {"page-height": 220, "page-width": 110},
    "Executive": {"page-height": 254, "page-width": 291},
    "Folio": {"page-height": 330, "page-width": 210},
    "Ledger": {"page-height": 432, "page-width": 279},
    "Legal": {"page-height": 356, "page-width": 216},
    "Letter": {"page-height": 279, "page-width": 216},
    "Tabloid": {"page-height": 432, "page-width": 279},
}
