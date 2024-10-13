# Frappe Betterprint

Frappe app with advanced print functions. This app depends on [betterprint_server](https://github.com/neocode-it/frappe_betterprint_server).

## Features

- Pdf-generation using a more modern chromium-based solution with full html & css support.
- "split_table_by_height(html, style, max_height)" Jinja method to split table into pages by calculating the rendered height per page.
- "better_page_break()" Jinja method

#### License

agpl-3.0