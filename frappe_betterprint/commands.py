import click


@click.command("setup-betterprint", help="Setup Betterprint & Browser")
def setup_betterprint():
    from frappe_betterprint.pdf_renderer import (
        install_browser,
    )

    install_browser()


@click.command("start-server", help="Start Betterprint server")
def start_server():
    from frappe_betterprint.pdf_renderer import start_server

    start_server(foreground=True)


commands = [setup_betterprint, start_server]
