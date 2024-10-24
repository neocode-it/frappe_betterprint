def is_betterprint_server_installed() -> bool:
    """Checks if the server is a callable process on the system"""
    try:
        subprocess.run(
            ["betterprint_server", "info"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return True
    except FileNotFoundError:
        return False
