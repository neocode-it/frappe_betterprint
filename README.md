> [!WARNING]
> This project is still in development so expect breaking changes!

# Frappe Betterprint

Frappe app with advanced print functions, mainly focused on improving custom Jinja print formats.

> [!NOTE]
> You can find all informations on how to use this app in our docs: [Frappe Betterprint Docs](https://frappe-betterprint.gitbook.io)

## Features

* Universal Layout: Preview/Printview/PDF - they look just the same.
* Full, mordern CSS support: Flexbox, W3C standards - all printed with headless Chromium.
* Individual page size per Print Format: Independent PDF size :slight_smile: 
* Page size unlimited (even A0 Format is possible)
* Preview support for large page sizes (even A0 or larger paper size is supported)
* Dynamic Headers & Footers: Apply different content per Page, add running numbers e.G.
* Parallel use of regular Print Formats and Print Designer possible
* [comin soon] Page ranges: Add different styles to parts of your pages

## Tools

* `better_page_break()` Jinja method: Simple way to add a page-break

## Installation

Install this app on your bench:
```
$ bench get-app https://github.com/neocode-it/frappe_betterprint
$ bench install-app frappe_betterprint
```
Install all required apt-packages using this command:
```
$ sudo apt-get update && \
sudo apt-get install -y libasound2 libatk-bridge2.0-0 \
libatk1.0-0 libatspi2.0-0 libcairo2 libcups2 libdbus-1-3 \
libdrm2 libgbm1 libglib2.0-0 libnspr4 libnss3 libpango-1.0-0 \
libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
libxkbcommon0 libxrandr2 xvfb fonts-noto-color-emoji fonts-unifont \
libfontconfig1 libfreetype6 xfonts-scalable fonts-liberation \
fonts-ipafont-gothic fonts-wqy-zenhei fonts-tlwg-loma-otf fonts-freefont-ttf
``` 

This app should be plug&play, but has not been tested on Frappe Cloud.

#### License

agpl-3.0
