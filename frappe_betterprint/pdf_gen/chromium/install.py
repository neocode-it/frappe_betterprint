import platform
import os
import sys
import zipfile
import io
import json
import urllib.request
import http.client

# Configuration
TARGET_MILESTONE = "135"
DOWNLOAD_DIR = os.path.join(os.getcwd(), "chromium")
VERSIONS_URL = "googlechromelabs.github.io"


def get_platform_details():
    """Returns platform key for Windows."""
    system = platform.system().lower()
    machine = platform.machine().lower()
    print(machine)
    if system == "windows" and machine in ["amd64", "x86_64"]:
        return "win64"
    elif system == "linux" and machine == "x86_64":
        return "linux64"
    raise ValueError(
        "Unsupported platform: Only Linux 64bit and Windows x86 64bit are supported."
    )


def fetch_version_data():
    """Fetches version info using `http.client`."""
    try:
        conn = http.client.HTTPSConnection(VERSIONS_URL)
        conn.request(
            "GET", "/chrome-for-testing/known-good-versions-with-downloads.json"
        )
        response = conn.getresponse()

        if response.status != 200:
            raise Exception(
                f"Failed to fetch data: {response.status} {response.reason}"
            )

        data = response.read().decode("utf-8")
        conn.close()
        return json.loads(data)

    except Exception as e:
        print(f"Error fetching version data: {e}")
        sys.exit(1)


def find_latest_build(milestone):
    """Finds latest build for the given milestone."""
    versions_data = fetch_version_data()
    for version in reversed(versions_data.get("versions", [])):
        if version.get("version", "").startswith(milestone + "."):
            return version
    print(f"No build found for milestone {milestone}.")
    sys.exit(1)


def download_file(url):
    """Downloads a ZIP file and returns its content as a BytesIO object."""
    print(f"Downloading from {url}...")

    try:
        with urllib.request.urlopen(url) as response:
            total_size = int(response.headers.get("Content-Length", 0))
            block_size = 8192
            downloaded_size = 0
            zip_content = io.BytesIO()

            # Download with progress
            while True:
                chunk = response.read(block_size)
                if not chunk:
                    break
                downloaded_size += len(chunk)
                zip_content.write(chunk)
                done = int(50 * downloaded_size / total_size) if total_size > 0 else 0
                sys.stdout.write(
                    f"\r[{'=' * done}{' ' * (50 - done)}] {downloaded_size / (1024 * 1024):.2f} MB"
                )
                sys.stdout.flush()

        print("\nDownload complete.")
        return zip_content

    except Exception as e:
        print(f"Error during download: {e}")
        sys.exit(1)


def extract_zip(zip_content, extract_to):
    """Extracts the contents of a ZIP file directly into extract_to, removing unnecessary parent folders."""
    print("\nExtracting...")

    try:
        os.makedirs(extract_to, exist_ok=True)

        with zipfile.ZipFile(zip_content, "r") as zf:
            members = zf.namelist()

            # Identify the common top-level folder (if exists)
            top_level_folder = os.path.commonprefix(members)
            if "/" in top_level_folder:
                top_level_folder = (
                    top_level_folder.split("/")[0] + "/"
                )  # Get only the first folder

            for member in members:
                stripped_member = (
                    member[len(top_level_folder) :]
                    if member.startswith(top_level_folder)
                    else member
                )
                target_path = os.path.join(extract_to, stripped_member)

                if member.endswith("/"):  # Handle directories
                    os.makedirs(target_path, exist_ok=True)
                else:
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    with zf.open(member) as src, open(target_path, "wb") as dst:
                        dst.write(src.read())

        print(f"Extracted directly to: {extract_to}")

    except Exception as e:
        print(f"Error during extraction: {e}")
        sys.exit(1)


def find_executable(download_dir):
    """Searches for Chromium executable."""
    exec_name = "chrome.exe" if platform.system().lower() == "windows" else "chrome"
    for root, _, files in os.walk(download_dir):
        if exec_name in files:
            return os.path.join(root, exec_name)
    return None


def install_chromium():
    try:
        # get frappe bench path
        import frappe

        DOWNLOAD_DIR = os.path.join(
            frappe.utils.get_bench_path(),
            "/betterprint-browser",
        )

        platform_key = get_platform_details()
        print(f"Platform detected: {platform_key}")

        version_info = find_latest_build(TARGET_MILESTONE)
        download_url = next(
            (
                d.get("url")
                for d in version_info.get("downloads", {}).get("chrome", [])
                if d.get("platform") == platform_key
            ),
            None,
        )

        if not download_url:
            print("Download URL not found for the platform.")
            sys.exit(1)

        zip_data = download_file(download_url)
        extract_zip(zip_data, DOWNLOAD_DIR)

        executable_path = find_executable(DOWNLOAD_DIR)
        if not executable_path:
            print(f"Executable not found in directory: {DOWNLOAD_DIR}")
            sys.exit(1)

        print(f"Chromium executable ready: {os.path.abspath(executable_path)}")

        if platform.system().lower() == "linux":
            print("Add execution permission to chromium")
            os.chmod(executable_path, 0o755)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    install_chromium()
