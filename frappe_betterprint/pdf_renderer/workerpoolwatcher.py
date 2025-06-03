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

    def _stop_thread(self):
        if self.threads:
            self.threads[0].stop()
            self.threads.pop(0)

    def _start_thread(self):
        thread = WorkerThread(self.task_queue)
        self.threads.append(thread)
        thread.start()

    def _cleanup_threads(self):
        """Remove any threads that are no longer alive."""
        active_threads = []

        for thread in self.threads:
            if thread.is_alive():
                active_threads.append(thread)

        self.threads = active_threads

    def run(self):
        """Thread entry point: Monitor queue and adjust threads dynamically."""
        while True:
            self._cleanup_threads()

            queue_size = self.task_queue.length()
            running_threads = len(self.threads)

            if running_threads < self.min_threads:
                self._start_thread()
            elif queue_size > 5 and running_threads < self.max_threads:
                self._start_thread()
            elif queue_size < 5 and running_threads > self.min_threads:
                self._stop_thread()

            time.sleep(0.5)
