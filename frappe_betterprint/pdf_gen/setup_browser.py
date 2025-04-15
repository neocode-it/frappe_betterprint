import os
import sys
import subprocess

import frappe


def install_playwright_browsers():
    print("Installing betterprint browsers...")
    bench_path = frappe.utils.get_site_path() + "/betterprint_browsers"

    # Install browser executables to bench/playwright folder
    # -> Required to share one exec. with all worker in every container
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = bench_path

    result = subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"])

    if result.returncode == 0:
        print("Browsers successfully installed")
    else:
        print("Failed installing browsers failed")
        print("Error: ", result.stderr)
