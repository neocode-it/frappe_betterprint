import subprocess
import requests
import frappe
import time


def prelaunch_server():
    if not is_betterprint_server_installed():
        frappe.throw(
            "Betterprint server seems to be missing on your instance. Please install Betterprint_Server."
        )

    try:
        # Launch server by default (won't create 2nd instance)
        subprocess.Popen(
            "betterprint_server run",
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(e)
        frappe.throw("ERROR: Couldn't start betterprint_server.")


def wait_for_ready():
    try:
        # Repeat if the server isn't ready to accept connections yet
        for _ in range(3):
            try:
                response = requests.get("http://127.0.0.1:39584/v1/status")
                if response.status_code != 200:
                    frappe.throw(
                        f"Couldn't launch betterprint_server: Response invalid. Received statuscode {response.status_code}"
                    )
                else:
                    return
            except requests.ConnectionError:
                pass

            time.sleep(0.5)
    except Exception as e:
        print(e)
        frappe.throw("ERROR: Couldn't start betterprint_server.")


def is_betterprint_server_installed() -> bool:
    """Checks if the server is a callable process on the system"""
    try:
        subprocess.run(
            ["betterprint_server", "info"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return True
    except FileNotFoundError:
        return False
