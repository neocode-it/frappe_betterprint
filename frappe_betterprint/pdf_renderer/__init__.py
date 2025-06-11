import subprocess
import requests
import time
import sys
import os

import psutil

import frappe


def install_browser():
    print("Installing betterprint browsers...")
    betterprint_browser_path = frappe.utils.get_bench_path() + "/betterprint_browser"
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = betterprint_browser_path

    result = subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"])

    if result.returncode == 0:
        print("Browsers successfully installed")
    else:
        print("Failed installing browsers failed")
        print("Error: ", result.stderr)


def start_server(foreground=False):
    # Maybe add check if the dependencies are installed here...

    betterprint_path = frappe.utils.get_bench_path() + "/betterprint_browser"
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = betterprint_path

    try:
        # Launch server
        # The server will exit by itself if there's already an instance running
        if foreground:
            subprocess.run(
                [sys.executable, "-m", "frappe_betterprint.pdf_renderer.server"],
                check=True,
                env=os.environ,
            )
        else:
            subprocess.Popen(
                [sys.executable, "-m", "frappe_betterprint.pdf_renderer.server"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                env=os.environ,
            )
    except Exception as e:
        frappe.throw("ERROR: Couldn't start betterprint_server.")


def stop_server():
    """Kill the betterprint server process if it is running."""
    try:
        for proc in psutil.process_iter(attrs=["pid", "name"]):
            if proc.info["name"] == "betterprint_server":
                psutil.Process(proc.info["pid"]).terminate()
    except subprocess.CalledProcessError:
        # If the process is not found, we can ignore the error
        pass


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
                    return True
            except requests.ConnectionError:
                # Server is inaccessible
                # If the server is not running yet, wait and try again
                pass

            time.sleep(0.5)

    except Exception as e:
        frappe.throw(f"Couldn't launch betterprint_server: {e}.")

    return False
