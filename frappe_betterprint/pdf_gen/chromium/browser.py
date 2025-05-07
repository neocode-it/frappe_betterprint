import subprocess
import time
import re
import websocket
import json

from page import Page


class Browser:
    chrome_path = None
    process = None
    command_counter = 0

    ws_port = 0

    ws = None
    pages = []

    def __init__(self, chrome_path, debug=False):
        self.chrome_path = chrome_path
        self.debug = debug

    def __exit__(self, exc_type, exc_value, traceback):
        # Close all pages, if they are not already closed
        for page in self.pages:
            page.close()

        if self.ws and self.ws.connected:
            try:
                self.ws.close()
            except Exception as e:
                print(f"Error while closing WebSocket: {e}")

        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()

    def __enter__(self):
        # Command to launch Chromium in headless mode with remote debugging enabled
        # --headless=new is the modern headless mode
        # --remote-debugging-port opens the DevTools Protocol port
        # --disable-gpu is often recommended in headless environments
        # --no-sandbox might be needed in some Linux environments (use with caution!)
        command = [
            self.chrome_path,
            # "--allow-running-insecure-content",
            # "--host-resolver-rules=MAP frappe.localhost 192.168.1.108",  # Pure gold for development purposes!
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",  # Required for Docker
            "--disable-dev-shm-usage",  # Disable dev/shm usage, which might cause issues in Docker
            "--remote-debugging-port=0",
            "--remote-allow-origins=*",  # Websocket allowrule
            "--disable-extensions",
            "--disable-default-apps",
            "--disable-component-update",
            "--disable-background-networking",
            "--disable-client-side-phishing-detection",
            "--disable-hang-monitor",
            "--disable-ipc-flooding-protection",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--disable-renderer-backgrounding",
            "--disable-search-engine-choice-screen",
            "--disable-field-trial-config",
            "--disable-background-networking",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-back-forward-cache",
            "--disable-breakpad",
            "--disable-client-side-phishing-detection",
            "--disable-component-extensions-with-background-pages",
            "--disable-component-update",
            "--disable-default-apps",
            "--disable-dev-shm-usage",
            "--disable-extensions",
            "--disable-features=ImprovedCookieControls,LazyFrameLoading,GlobalMediaControls,DestroyProfileOnBrowserClose,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater,AvoidUnnecessaryBeforeUnloadCheckSync,Translate,HttpsUpgrades,PaintHolding,ThirdPartyStoragePartitioning,LensOverlay,PlzDedicatedWorker",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--force-color-profile=srgb",
            "--no-first-run",
            "--no-default-browser-check",
            "--metrics-recording-only",
            "--password-store=basic",
            "--use-mock-keychain",  # macOS/linux specific, that use keychains
            "--no-service-autorun",
            "--mute-audio",
            "--no-default-browser-check",
            "--allow-pre-commit-input",
            "--force-color-profile=srgb",
            "--metrics-recording-only",
            "--no-first-run",
            "--password-store=basic",
            "--use-mock-keychain",
            "--no-service-autorun",
            "--export-tagged-pdf",
            "--disable-search-engine-choice-screen",
            "--unsafely-disable-devtools-self-xss-warnings",
            "--enable-use-zoom-for-dsf=false",
            "--use-angle",
            "--headless",
            "--hide-scrollbars",
            "--mute-audio",
            "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
            "--no-startup-window",
        ]

        try:
            # Use subprocess.Popen to capture output as it happens
            self.process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,  # Decode output as text
                bufsize=1,  # Line-buffered output
                universal_newlines=True,  # Alternative for text=True in older Python
            )

            if (
                not self.process or self.process.poll()
            ):  # Poll = not None means process is running
                raise Exception("Cannot connect to Browser: Browser is not running")

            self.ws_port = None
            start_time = time.time()
            # Read stderr line by line to find the DevTools URL
            # The URL is typically printed to stderr
            for line in iter(self.process.stderr.readline, ""):
                if "DevTools listening on" in line:
                    # Extract the URL using regex
                    match = re.search(r"ws://127\.0\.0\.1:(\d+)/.+", line)
                    if match:
                        # Set port of the browser
                        self.ws_port = int(match.group(1))
                        devtools_url = line.strip().split()[
                            -1
                        ]  # Converts the url from the debug string

                        self.ws = websocket.create_connection(devtools_url)
                        return self

                if time.time() - start_time > 10:
                    raise TimeoutError("Timeout waiting for DevTools URL.")

        except FileNotFoundError:
            raise Exception(f"Error: Chromium binary not found at {self.chrome_path}")

        stdout, stderr = self.process.communicate(timeout=10)
        raise Exception(f"Browser couldn't be started. {stderr}")

    def new_page(self, mock_domain=None):
        initial_url = "about:blank"

        create_target_id = self.send_command(
            "Target.createTarget", {"url": initial_url}
        )
        create_target_response = self.get_response(create_target_id)

        if not create_target_response or "error" in create_target_response:
            raise Exception(f"Failed creating page {create_target_response}")

        if (
            "result" not in create_target_response
            or "targetId" not in create_target_response["result"]
        ):
            raise Exception(
                f"Unexpected response from the Browser: {create_target_response}"
            )

        page = Page(
            self.ws_port, create_target_response["result"]["targetId"], mock_domain
        )
        self.pages.append(page)
        return page

    def send_command(self, method, params=None):
        """Sends a CDP command and returns its ID."""
        self.command_counter += 1
        command_id = self.command_counter
        command = {"id": command_id, "method": method, "params": params or {}}
        self.ws.send(json.dumps(command))
        # print(f"Sent command ID {command_id}: {method}") # Uncomment for debugging
        return command_id

    def get_response(self, command_id, timeout=10):
        """Waits for a response with a specific command ID."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                message_str = self.ws.recv()
                message = json.loads(message_str)

                # print(f"Received message: {message_str}") # Uncomment for debugging

                if message.get("id") == command_id:
                    # print(f"Received response for ID {command_id}") # Uncomment for debugging
                    return message
                elif "method" in message:
                    # It's an event, ignore for this simple response waiter
                    pass
                else:
                    # Ignore other messages
                    pass

            except websocket.WebSocketException as e:
                print(f"WebSocket error while waiting for response: {e}")
                return None
            except json.JSONDecodeError:
                print(f"Failed to decode JSON message: {message_str}")
                return None
            except Exception as e:
                print(f"An unexpected error occurred while waiting: {e}")
                return None

        print(f"Timeout waiting for response to command ID {command_id}.")
        return None
