# Frappe Betterprint

Frappe app with advanced print functions, mainly focused on improving custom Jinja print formats. This app depends on [betterprint_server](https://github.com/neocode-it/frappe_betterprint_server) in order to generate pdf's.

## Features

- **More modern pdf-generation**
PDF-rendering based on chromium allows moderndays html ans css support and uniform prints. Simply check "Generate PDF using Frappe Betterprint" in Print Format settings. Frappe Betterprint also unsets every default style for print preview in order to prevent differences between preview/actual print.
- **Individual page size per Print Format**
Select individual pdf page size per Print Format: Enable Betterprint within print format settings and select your Page size.
- **`better_page_break()` Jinja method** 
Jinja method to display a visible page break in preview, and actual page break in prints.
- **Preview support for pages larger than A4**
Betterprint formats larger than A4 (up to A0 and more) can be displayed in a scaled format in the preview and even on the public-share-link page.

## Experimental Features

- **`split_table_by_height(html, style, max_height)` Jinja method"** 
Jinja method to split table into pages by calculating the (actual) rendered height per page.

#### License

agpl-3.0