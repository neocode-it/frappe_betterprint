# Frappe Betterprint

Frappe app with advanced print functions, mainly focused on improving custom Jinja print formats. This app depends on [betterprint_server](https://github.com/neocode-it/frappe_betterprint_server).

## Features

- Pdf-generation using a more modern chromium-based solution with full html & css support.
- Set individual page size per print format
- "split_table_by_height(html, style, max_height)" Jinja method to split table into pages by calculating the (actual) rendered height per page.
- "better_page_break()" Jinja method to display a visible page break

## Limitations

- Private files cannot be loaded

#### License

agpl-3.0