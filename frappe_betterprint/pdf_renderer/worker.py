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

def worker_thread(q):
    # Nested try-catch to try-close playwright after every attempt.
    # If that fails too, theres a backup try-catch
    playwright = None
    browser = None
    task = None
