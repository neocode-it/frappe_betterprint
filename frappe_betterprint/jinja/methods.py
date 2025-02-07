import frappe_betterprint.utils.print as pdf_utils
import frappe_betterprint.utils.server as betterprint_server
import requests
import json


def better_page_break():
    return pdf_utils.page_break()


def calculate_pages(betterprint: dict, html: str, style: str, max_height: int):
    betterprint_server.prelaunch_server()

    css = pdf_utils.get_printstyle(betterprint["print_format_name"])

    # Inline private images and expand relative urls
    html = pdf_utils.prepare_html_for_external_use(html)
    # wrap content and css within print page wrapper
    html = pdf_utils.html_wrapper(html, css + " \n" + style)

    body = {
        "html": html,
        "max-height": max_height,
    }
    body = json.dumps(body)

    betterprint_server.wait_for_ready()

    response = requests.get(
        "http://127.0.0.1:39584/v1/split-table-by-height",
        data=body,
        headers={"content-type": "application/json"},
        timeout=10,
    )
    if response.status_code == 200:
        return json.loads(response.content)

    raise Exception(
        "Betterprint_server response invalid: couldn't calculate html element height"
    )
