from frappe_betterprint.pdf_gen.chromium.browser import Browser
import frappe
import os


def generate_pdf(html, site_url):
    "Generate a PDF from HTML content using Chromium."
    bench = frappe.utils.get_bench_path()
    chrome_path = os.path.join(bench, "betterprint-chrome", "chrome")
    with Browser(chrome_path) as browser:
        page = browser.new_page(mock_domain=site_url)

        page.set_content(html)
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

        pdf_content = page.pdf()
        page.close()

        return pdf_content
