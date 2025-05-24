import subprocess
import requests
import time
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


def check_server_status(timeout=10):
    try:
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get("http://127.0.0.1:39584/v1/status", timeout=1)
                if response.status_code != 200:
                    frappe.throw(
                        f"Couldn't launch betterprint_server: Response invalid. Received statuscode {response.status_code}"
                    )
                else:
                    return
            except requests.ConnectionError:
                # Server is inaccessible
                # If the server is not running yet, wait and try again
                pass

            time.sleep(0.5)

    except Exception as e:
        frappe.throw(f"Couldn't launch betterprint_server: {e}.")

    return False
