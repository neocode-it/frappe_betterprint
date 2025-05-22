import click


@click.command("setup-betterprint", help="Setup Betterprint & Browser")
def setup_betterprint():
    from frappe_betterprint.pdf_gen.chromium.install import (
        install_chromium,
    )

    install_chromium()


@click.command("start-server", help="Start Betterprint server")
def start_server():
    from frappe_betterprint.pdf_renderer import launch_browser

    launch_browser()


commands = [setup_betterprint, start_server]
