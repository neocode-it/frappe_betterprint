# Frappe Betterprint

Frappe app with advanced print functions, mainly focused on improving custom Jinja print formats. This app depends on [betterprint_server](https://github.com/neocode-it/frappe_betterprint_server).

## Features

- **More modern pdf-generation**
PDF-rendering based on chromium allows moderndays html ans css support and uniform prints. Simply check "Generate PDF using Frappe Betterprint" in Print Format settings. Frappe Betterprint also unsets every default style for print preview in order to prevent differences between preview/actual print.
- **Individual page size per Print Format**
Select individual pdf page size per Print Format: Enable Betterprint within print format settings and select your Page size.
- **`split_table_by_height(html, style, max_height)` Jinja method"** 
Jinja method to split table into pages by calculating the (actual) rendered height per page.
- **`better_page_break()` Jinja method** 
Jinja method to display a visible page break in preview, and actual page break in prints.

## Current Limitations

- **Large table rows will overflow the page**
If a table-row is larger than the whole page, it can't be split any smaller - leading to page overflow.
- **Limited private file support**
Only private images (<img> tag) will be included in the print format. Other html sources must be public! This is due to missing session-cookie support.

#### License

agpl-3.0