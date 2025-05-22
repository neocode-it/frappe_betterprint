import frappe
import multiprocessing

import frappe_betterprint.pdf_renderer.server as renderer_server


def launch_browser():
    config = frappe.get_common_site_config()

    external_betterprint = config.get("external_betterprint", None)

    if external_betterprint:
        raise Exception("This feature is not available in external betterprint yet.")

    server = multiprocessing.Process(target=renderer_server.start_server)
    server.start()


# def get_server_hostname():
#     s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
#     s.connect(("8.8.8.8", 80))  # Connect to an external server (Google DNS)
#     local_ip = s.getsockname()[0]
#     s.close()
#     return local_ip
