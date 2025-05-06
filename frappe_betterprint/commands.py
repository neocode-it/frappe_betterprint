import click


@click.command("setup-betterprint", help="Setup Betterprint & Browser")
def setup_betterprint():
    from frappe_betterprint.pdf_gen.chromium.install import (
        install_chromium,
    )

    install_chromium()


commands = [setup_betterprint]
