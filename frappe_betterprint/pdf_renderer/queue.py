import threading
import queue
import uuid


class WorkerQueue:
    _result = {}
    _result_condition = threading.Condition()

    _q = queue.Queue()

    def run_and_wait(self, command: str, content: dict = None, timeout: int = 30):
        key = uuid.uuid4()
        self._q.put({"key": key, "command": command, **content})

        with self._result_condition:
            if not self._result_condition.wait_for(lambda: key in self._result, timeout):
                raise TimeoutError(f"Operation timed out after {timeout} seconds.")

            return self._result.pop(key)

    def length(self):
        return self._q.qsize()

    def get_task(self):
        return self._q.get(timeout=1)

    def task_done(self, task: dict, result: dict):
        with self._result_condition:
            self._result[task["key"]] = result
            self._result_condition.notify_all()


global_queue = WorkerQueue()
