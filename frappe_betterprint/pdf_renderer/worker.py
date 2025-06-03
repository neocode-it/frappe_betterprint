import threading
import time
import queue
import re
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


class WorkerThread(threading.Thread):
    def __init__(self, queue):
        super().__init__()
        self.queue = queue
        self.daemon = True
        self.stop_event = threading.Event()

    def stop(self):
        """Public method to stop the thread."""
        self.stop_event.set()  # Signal the thread to stop

    def run(self):
        # Nested try-catch to try-close playwright after every attempt.
        # If that fails too, theres a backup try-catch
        playwright = None
        browser = None
        task = None

        try:
            playwright = sync_playwright().start()
            browser = playwright.chromium.launch()
            while not self.stop_event.is_set():
                try:
                    task = self.queue.get_task()

                    if task["command"] == "generate-betterprint-pdf":
                        result = self.generate_betterprint_pdf(task, browser)

                    else:
                        result = {"error": True, "description": "WORKER ERROR: Command not found"}

                    if result is None:
                        result = {"error": True, "content": "Missing response from worker"}

                    result = {"error": False, "content": "", **result}
                    self.queue.task_done(task, result)

                except queue.Empty:
                    time.sleep(0.2)

        except Exception as _:
            print("Exception occurred in Workerthread. Gathering log data and restart worker...")

            # Check if there was an interrupt within an ongoing task.
            # If so, terminate task and report error
            if task:  # Ongoing task?
                self.queue.task_done(task, {"error": True, "content": "Error ocurred in workerthread"})

            # Throw exception to signal an issue for the worker_backbone
            raise Exception("Important! Required to signal worker_backbone there went something wrong")
        finally:
            # Try to close browser and playwright if they are initialized.
            # Might fail too, depending on the exception.
            if browser:
                browser.close()
            if playwright:
                playwright.stop()

