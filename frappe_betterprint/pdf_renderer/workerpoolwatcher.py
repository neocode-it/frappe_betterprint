import threading
import time

from frappe_betterprint.pdf_renderer.worker import WorkerThread


class WorkerPoolWatcher(threading.Thread):
    def __init__(self, task_queue, min_threads=1, max_threads=3):
        super().__init__()
        self.daemon = True

        self.threads = []
        self.task_queue = task_queue
        self.min_threads = min_threads
        self.max_threads = max_threads

