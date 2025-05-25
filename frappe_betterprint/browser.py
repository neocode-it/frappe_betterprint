class Browser:
    _instance = None  # Class attribute to hold the singleton instance
    new_uuid = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:  # Check if an instance already exists
            cls._instance = super().__new__(cls)  # Create a new instance
            import uuid

            cls.new_uuid = uuid.uuid4()

        return cls._instance  # Return the existing or new instance

    def __init__(self):
        """Optional: Initialization logic, guarded to avoid multiple calls."""
        if hasattr(self, "_initialized"):
            return
        self._initialized = True
        # Add initialization logic here
        print("\n\n\nSingleton instance initialized.\n\n\n")

    def uuid(self):
        return self.new_uuid
