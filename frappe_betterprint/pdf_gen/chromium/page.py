import base64
import queue

from websocket_listener import WebSocketListener


class Page:
    websocket_listener = None
    command_counter = 0

    response_queue = queue.Queue()

    def __init__(self, port, id, mock_domain=None):
        URL = f"ws://127.0.0.1:{port}/devtools/page/{id}"
        self.websocket_listener = WebSocketListener(URL, mock_domain)
        self.websocket_listener.start()

    def send_and_wait(self, command, params=None):
        """Sends a CDP command and returns its ID."""
        id = self.websocket_listener.send_cdp_command(command, params)
        return self.receive(id)

    def send(self, command, params=None):
        self.websocket_listener.send_cdp_command(command, params)

    def receive(self, command_id, timeout=10):
        """
        Waits for a response with a specific command ID.
        """
        return self.websocket_listener.receive_cdp_result(command_id, timeout)

    def navigate(self, url):
        params = {
            "url": url,
        }
        return self.send_and_wait("Page.navigate", params)

    def exec_js(self, js_code):
        self.send_and_wait("Runtime.enable")
        param = {
            "expression": js_code,
            "awaitPromise": True,
        }
        return self.send_and_wait("Runtime.evaluate", param)

    def screenshot(self, output_file):
        self.send_and_wait("Page.enable")
        message = self.send_and_wait("Page.captureScreenshot")
        image_data = message["result"]["data"]
        with open(output_file, "wb") as file:
            file.write(base64.b64decode(image_data))
        print(f"Screenshot saved to {output_file}")

    def pdf(self, filepath=None):
        # Page.printToPDF options can be added in the params dictionary
        pdf_options = {
            "printBackground": True,  # Include background graphics
            # "format": "A4",
            "displayHeaderFooter": False,
            "paperWidth": 8.3,
            "paperHeight": 11.7,
            "generateTaggedPDF": True,
        }
        print_pdf_response = self.send_and_wait("Page.printToPDF", pdf_options)

        pdf_data_base64 = print_pdf_response["result"]["data"]

        if filepath:
            with open(filepath, "wb") as file:
                file.write(base64.b64decode(pdf_data_base64))
            return
        else:
            return base64.b64decode(pdf_data_base64)

    def set_content(self, html):
        gg = self.send_and_wait("Page.getFrameTree", {})
        frame_tree_params = gg.get("result")

        main_frame_id = 0
        if (
            frame_tree_params
            and frame_tree_params.get("frameTree")
            and frame_tree_params["frameTree"].get("frame")
        ):
            main_frame_id = frame_tree_params["frameTree"]["frame"]["id"]

        params = {"frameId": main_frame_id, "html": html}
        return self.send_and_wait("Page.setDocumentContent", params)

    def close(self):
        """Only closes the websocket, but must be called before destrying the object"""
        self._close_websocket_listener()

    def _close_websocket_listener(self):
        try:
            if self.websocket_listener:
                self.websocket_listener.stop()
        except Exception as e:
            print(f"Error while closing WebSocketListener: {e}")
