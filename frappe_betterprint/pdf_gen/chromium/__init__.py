from frappe_betterprint.pdf_gen.chromium.browser import Browser
import frappe
import os


def generate_pdf(html, site_url):
    "Generate a PDF from HTML content using Chromium."

    log("generate_pdf")

    bench = frappe.utils.get_bench_path()
    chrome_path = os.path.join(bench, "betterprint-chrome", "chrome")
    with Browser(chrome_path) as browser:
        log("Browser started")
        page = browser.new_page(mock_domain=site_url)

        page.set_content(html)
        log("Page content set")
        js = """
            new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (window.betterPrintFinished) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        """
        page.exec_js(js)
        log("JavaScript executed")

        pdf_content = page.pdf()
        log("PDF generated")
        page.close()

        log("Page closed")

        return pdf_content


def before_request():
    if frappe.request.path == "/api/method/frappe.utils.print_format.download_pdf":
        log("before_request")


def log(message):
    """
    Log a message to the console.
    """
    import time

    time.time()
    with open("frappe_betterprint.log", "a") as log_file:
        # log with timestamp including ms
        log_file.write(
            f"{time.strftime('%H:%M:%S')}:{int(time.time() * 1000) % 1000:03d} - {message}\n"
        )
