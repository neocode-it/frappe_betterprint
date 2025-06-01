import threading
import time
import queue
import re
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def launch_worker_thread(global_queue):
    threading.Thread(target=worker_thread, daemon=True, args=(global_queue,)).start()


def worker_thread(q):
    # Nested try-catch to try-close playwright after every attempt.
    # If that fails too, theres a backup try-catch
    playwright = None
    browser = None
    task = None
