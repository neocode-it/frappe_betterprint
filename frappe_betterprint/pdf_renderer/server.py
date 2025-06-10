import os
import setproctitle
import json

from waitress import serve
from filelock import Timeout, FileLock
from werkzeug.wrappers import Request, Response
import frappe

from frappe_betterprint.pdf_renderer.queue import global_queue
from frappe_betterprint.pdf_renderer.worker import launch_worker_thread
import frappe_betterprint.pdf_renderer.validation as validation


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


def application(environ, start_response):
    request = Request(environ)
    # Parse json
    data = None
    lenght = len(request.get_data())
    if lenght and lenght < 10_000_000:
        data = request.get_json()

    # Set default response
    response = Response("Internal server error", status=500)

    route_map = {
        "/v1/status": status,
        "/v1/generate-betterprint-pdf": generate_betterprint_pdf,
    }

    if request.path in route_map:
        response = route_map[request.path](data)
    else:
        response = Response("Not Found", status=404)

    return response(environ, start_response)


def status(_):
    return Response("BETTERPRINT OK", mimetype="text/plain")


def generate_betterprint_pdf(data):
    validation_errors = validation.validate(
        data,
        {
            "filepath": [validation.is_valid_pdf_filepath],
            "allow_origin": [validation.is_valid_url],
            "html": [validation.is_valid_string],
        },
    )

    if validation_errors:
        response = {
            "message": "Invalid input data passed to betterprint_server",
            "errors": validation_errors,
        }
        return Response(json.dumps(response), mimetype="application/json", status=422)

    result = global_queue.run_and_wait("generate-betterprint-pdf", data)

    error = result.get("error", False)
    content = json.dumps(result.get("content"))

    if error:
        return Response(content, status="500", mimetype="application/json")

    return Response(content, mimetype="application/json")


if __name__ == "__main__":
    start_server()  # Ensure it runs when executed directly
