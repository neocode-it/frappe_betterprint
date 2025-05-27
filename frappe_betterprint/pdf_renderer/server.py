
from waitress import serve
from filelock import Timeout, FileLock
import frappe

from frappe_betterprint.pdf_renderer.queue import global_queue
from frappe_betterprint.pdf_renderer.worker import launch_worker_thread

def start_server(public=False):
    setproctitle.setproctitle("betterprint_server")

    # Store lockfile on bench path to make if container-specific lockfile
    lockfile = os.path.join(frappe.utils.get_bench_path(), "betterprint_server", "server.lock")
    lock = FileLock(lockfile)

    try:
        with lock.acquire(blocking=False):
            print("Serving App on localhost using port 39584. Press Ctrl. + C to stop...")

            # Launch playwright worker thread
            launch_worker_thread(global_queue)

            # Launch http server as interface
            if public:
                serve(application, host="0.0.0.0", port=39584)
            else:
                serve(application, host="127.0.0.1", port=39584)

    except Timeout:
        print("Cannot start server: Another instance of Betterprint Server currently holds the lock.")
        exit(1)

if __name__ == "__main__":
    start_server()  # Ensure it runs when executed directly
