import threading
import queue
import json
import time
import re
from urllib.parse import urlparse

import websocket


# This class will be running as thread
# Start with Class.start()
# Will terminate as soon as the websocket is closed
# Exposes request_queue and response_queue
# Stop needs to be called after execution!!
class WebSocketListener(threading.Thread):
    command_counter = 0
    response_queue = queue.Queue()
    running = False
    mock_domain = ""
    websocket = None

    def __init__(self, websocket_url, mock_domain=None):
        """
        Initialize the WebSocketListener.
        Pass an already initialized WebSocket instance.
        If `mock_domain` is set, CORS mocking will be enabled for this domain.
        """
        super().__init__()
        self.mock_domain = mock_domain
        self.websocket = websocket.create_connection(websocket_url)
        if mock_domain:
            self._setup_cors(mock_domain)

    def _setup_cors(self, mock_domain):
        parsed_url = urlparse(mock_domain)
        full_domain = parsed_url.netloc
        domain = full_domain.split(":")[0]  # Remove the port if present

        self.mock_domain_pattern = rf"^https?://{re.escape(domain)}(:[0-9]+)?(/|$)"

        # TODO: implement Domain pattern!
        params = {
            "patterns": [
                {"urlPattern": "*", "requestStage": "Response"},
            ],
        }

        self.send_cdp_command("Fetch.enable", params)

    def run(self):
        """
        Start the listener thread and manage WebSocket communication.
        """
        self.running = True

        if not self.websocket:
            raise ValueError("No WebSocket instance provided.")

        while self.running:
            try:
                # Check if the WebSocket is still open
                if (
                    not self.websocket.connected
                ):  # WebSocket-client provides a `connected` attribute
                    print("WebSocket connection closed. Terminating listener.")
                    break

                # Handle incoming WebSocket messages
                message_str = self.websocket.recv()
                if not message_str:  # Connection closed
                    print("WebSocket connection closed by remote.")
                    break

                message = json.loads(message_str)

                # Handle asynchronous events (no 'id')
                if "method" in message:
                    method = message["method"]

                    if method == "Fetch.requestPaused":
                        self._mock_domain(message)
                    elif method == "Network.loadingFailed":
                        print(message)

                    # Add event details to the response queue
                    self.response_queue.put(message)  # Store all events

                # Handle command responses (with 'id')
                elif "id" in message:
                    # Add the response to the queue for further processing
                    self.response_queue.put(message)

            except (websocket.WebSocketException, ConnectionRefusedError) as e:
                print(f"WebSocket error in handler thread: {e}")
                break  # Exit thread on connection error
            except json.JSONDecodeError:
                print(f"Failed to decode JSON message: {message_str}")
                continue  # Skip this message
            except Exception as e:
                print(f"Unexpected error occurred: {e}")
                break  # Exit thread on unhandled error

        print("WebSocket message handler stopped.")
        self.running = False

    def stop(self):
        """
        Stop the listener thread gracefully.
        """
        self.running = False
        if self.websocket:
            self.websocket.close()

    def _mock_domain(self, message, params=None):
        params = message["params"]
        request_id = params["requestId"]
        request = params["request"]
        request_url = request["url"]

        if not re.match(self.mock_domain_pattern, request_url):
            self.send_cdp_command("Fetch.continueResponse", {"requestId": request_id})

        status_code = params.get("responseStatusCode", 200)
        response_headers = params.get("responseHeaders", [])

        response_headers = params.get("responseHeaders", [])

        # Convert headers to a dictionary for easy lookup
        header_dict = {header["name"]: header["value"] for header in response_headers}

        # Update or add the header
        header_dict["access-control-allow-origin"] = "*"

        # Convert back to list format
        response_headers = [
            {"name": name, "value": value} for name, value in header_dict.items()
        ]

        self.send_cdp_command(
            "Fetch.continueResponse",
            {
                "requestId": request_id,
                "responseCode": status_code,
                "responseHeaders": response_headers,
            },
        )

    def send_cdp_command(self, command, params={}):
        """
        Send a command to the WebSocket server.
        """
        self.command_counter += 1
        command_id = self.command_counter
        command = {"id": command_id, "method": command, "params": params}
        self.websocket.send(json.dumps(command))
        return command_id

    def receive_cdp_result(self, command_id, timeout=10):
        """
        Waits for a response with a specific command ID.
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # Retrieve messages from the response queue with a timeout
                message = self.response_queue.get(timeout=0.1)

                # Check if this is the response we are waiting for
                if message.get("id") == command_id:
                    return message  # Return the matching message

                # else:
                #     # Handle unexpected responses
                #     print(
                #         f"Main: Received unexpected response ID {message.get('id')} from queue."
                #     )
            except queue.Empty:
                # No message available in the queue, continue waiting
                pass
            except Exception as e:
                print(f"Main: Error while getting from queue: {e}")
                break  # Exit waiting loop on error

        return None
