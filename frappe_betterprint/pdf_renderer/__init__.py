import subprocess
import requests
import sys

import frappe

def start_server():
    # Maybe add check if the dependencies are installed here...

    try:
        # Launch server
        # The server will exit by itself if there's already an instance running
        subprocess.Popen(
            [sys.executable, "-m", "frappe_betterprint.pdf_renderer.server"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(e)
        frappe.throw("ERROR: Couldn't start betterprint_server.")


