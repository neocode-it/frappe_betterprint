/*! @license Paginatejs v1.0.0 | MIT License | (C) 2025 Neocode */
(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === "object" && typeof module === "object")
    module.exports = factory();
  else if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof exports === "object") exports["Paginate"] = factory();
  else root["Paginate"] = factory();
})(self, () => {
  return /******/ (() => {
    // webpackBootstrap
    /******/ "use strict";
    /******/ var __webpack_modules__ = {
      /***/ "./src/objects/decorator.js":
        /*!**********************************!*\
  !*** ./src/objects/decorator.js ***!
  \**********************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Decorator: () => /* binding */ Decorator,
            /* harmony export */
          });
          /**
           * Decorator class will decorate all pages after rendering. It's main purpose:
           * - Parse betterprint elements
           * - Render Header / Footer content
           * - Add page numbers
           */
          class Decorator {
            constructor(pages) {
              this.reservedKeys = ["pageNumber", "totalPages"];
              this.pages = pages;
            }
            decorate() {
              const sources = this.#parsePages(this.pages);
              this.#renderHeader(sources);
              this.#renderFooter(sources);
            }
            #renderHeader(sources) {
              this.pages.forEach((page, i) => {
                this.#renderPageHeader(page, sources[i - 1], sources[i], i + 1);
              });
            }
            #renderPageHeader(page, prevSources, sources, pageNumber) {
              // First page?
              // Add first header found on page 1
              if (pageNumber == 1) {
                const firstHeader = page.content.querySelectorAll(
                  'paginate-source[data-key="header"]'
                )[0];
                if (firstHeader) {
                  page.header.innerHTML = firstHeader.innerHTML;
                }
              } else {
                // Else add current header if any
                const header = prevSources[this.hash("header")];
                if (header) {
                  page.header.innerHTML = header.innerHTML;
                }
              }

              // If page isn't first one, set paginate source data to previous page,
              // in order to allow the header to show past content only
              const pageSource = pageNumber == 1 ? sources : prevSources;
              let targets = page.header.querySelectorAll(
                'paginate-target:not([data-status="solved"])'
              );

              // Resolve targets until there is none left
              while (targets.length) {
                targets.forEach((target) => {
                  const key = target.getAttribute("data-key") ?? "empty-key";

                  // Always take page numer from current page
                  if (key === "pageNumber" || key === "totalPages") {
                    target.innerHTML = sources[this.hash(key)]?.innerHTML ?? "";
                  }
                  // If key is header, this will cause a infinite loop
                  else if (key !== "header") {
                    target.innerHTML =
                      pageSource[this.hash(key)]?.innerHTML ?? "";
                  }
                  target.setAttribute("data-status", "solved");
                });
                targets = page.header.querySelectorAll(
                  'paginate-target:not([data-status="solved"])'
                );
              }
            }
            #renderFooter(sources) {
              this.pages.forEach((page, i) => {
                this.#renderPageFooter(page, sources[i]);
              });
            }
            #renderPageFooter(page, sources) {
              const footer = sources[this.hash("footer")];
              if (footer) {
                page.footer.innerHTML = footer.innerHTML;
              }
              let targets = page.footer.querySelectorAll(
                'paginate-target:not([data-status="solved"])'
              );

              // Resolve targets until there is none left
              while (targets.length) {
                targets.forEach((target) => {
                  const key = target.getAttribute("data-key") ?? "empty-key";

                  // If key is header, this will cause a infinite loop
                  if (key !== "footer") {
                    target.innerHTML = sources[this.hash(key)]?.innerHTML ?? "";
                  }
                  target.setAttribute("data-status", "solved");
                });
                targets = page.footer.querySelectorAll(
                  'paginate-target:not([data-status="solved"])'
                );
              }
            }

            /**
             * Calculates the references of each page individually
             * add default keys to the content like page numbers
             * @param {list[Page]} pages
             * @returns {Array referencePages}
             */
            #parsePages(pages) {
              let referencePages = [];
              let previousReferences = {};
              for (let i = 0; i < pages.length; i++) {
                let pagePreference = this.parseCurrentPage(pages[i]);

                // add previous references to this page too
                pagePreference = Object.assign(
                  {},
                  previousReferences,
                  this.parseCurrentPage(pages[i])
                );

                // Insert page to preferences list and update previousReference for next page
                referencePages.push(pagePreference);
                previousReferences = pagePreference;
              }
              this.insertPageNumberReference(referencePages);
              return referencePages;
            }

            /**
             * Searches current page for source content and generates a
             * Object of every reference. References are a hash-value of the data-key attribute
             *
             *
             * @param {Element} page - Page to search for source content
             * @returns {Object references} references
             */
            parseCurrentPage(page) {
              // This will fetch all source-elements in a recursive way, starting from the beinning of the page
              const sources = page.content.querySelectorAll("paginate-source");
              let references = {};
              // Let's parse the sources and overrite existing ones
              sources.forEach((source) => {
                // Get key of this source-element
                const dataKey = source.getAttribute("data-key");

                // Check if the key attribute exists and is not empty or reservedKey
                if (
                  dataKey &&
                  dataKey.trim() !== "" &&
                  !this.reservedKeys.includes(dataKey)
                ) {
                  // create hash of dataKey in oder to prevent invalid Object keys
                  const hash = this.hash(dataKey);
                  references[hash] = source;
                }
              });
              return references;
            }

            /**
             * Insert page number references into each page references
             *
             * @param {Array} references
             * @returns {null}
             */
            insertPageNumberReference(referencePages) {
              const totalPages = document.createElement("span");
              totalPages.innerHTML = referencePages.length;
              const pageNumberHash = this.hash("pageNumber");
              const totalPagesHash = this.hash("totalPages");
              for (let i = 0; i < referencePages.length; i++) {
                const pageNumber = document.createElement("span");
                pageNumber.innerHTML = i + 1;
                referencePages[i][pageNumberHash] = pageNumber;
                referencePages[i][totalPagesHash] = totalPages;
              }
            }

            /**
             * Returns a hash code from a string
             * Please note: not recommended for security applications! insecure.
             *
             * @param  {String} str The string to hash.
             * @return {Number}    A 32bit integer
             * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
             */
            hash(str) {
              let hash = 0;
              for (let i = 0, len = str.length; i < len; i++) {
                let chr = str.charCodeAt(i);
                hash = (hash << 5) - hash + chr;
                hash |= 0; // Convert to 32bit integer
              }
              return hash;
            }
          }

          /***/
        },

      /***/ "./src/objects/documentlayoutmanager.js":
        /*!**********************************************!*\
  !*** ./src/objects/documentlayoutmanager.js ***!
  \**********************************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ DocumentLayoutManager: () =>
              /* binding */ DocumentLayoutManager,
            /* harmony export */
          });
          /* harmony import */ var _page_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(/*! ./page.js */ "./src/objects/page.js");

          /**
           * DocumentLayoutManager is responsible for general tasks such as:
           * - Generate base wrapper for paginate.js pages
           * - Insert base css required for paginate.js
           * - Add media print settings for paginate.js
           * - Responsible to calculate and create new pages with preset layout (size & style)
           */
          class DocumentLayoutManager {
            constructor(parentElement) {
              this.parentElement = parentElement;
              this.targetDocument = parentElement.ownerDocument;
            }
            preparePrintLayout() {
              let time = performance.now();
              this.#addPrintWrapper();
              this.#ensureCssAccess();
              this.#convertExternalStyleSheetsInline();
              this.#moveStylesToHead();
              this.#replaceInvalidStyleRules();
              // this.#removeMediaPrintRules();
              this.#addBasePrintStyles();
              this.#determinePageDimensions();
              this.#setPrintPageSize();
              console.log(
                `PaginateJS: Prepared print layout in ${Math.round(
                  performance.now() - time
                )}ms`
              );
            }
            finishPrintLayout() {
              this.#adjustLastPage();
            }
            #adjustLastPage() {
              const lastPage = this.wrapper.lastElementChild;
              if (!lastPage) return;
              lastPage.style.height = lastPage.offsetHeight - 2 + "px";
              lastPage.style.maxHeight = lastPage.style.height;
            }

            /**
             * Adds new page to the page wrapper
             *
             * @returns {Page} - new Page object
             */
            insertPage(pageRange = []) {
              return new _page_js__WEBPACK_IMPORTED_MODULE_0__.Page(
                this.wrapper,
                this.pageWidth,
                this.pageHeight,
                pageRange
              );
            }

            /**
             * Will make sure all referenced css files will be accessible.
             *
             * Backgrounds: In order to parse CSS using JS (which paginate.js depends on), it's required that cors ist allowed
             * for all external stylesheets and crossorigin="anonymous" attribute is set. If latter is not set
             * (which will only load css, but still prevent access), we can try to load it manuelly using xhr request.
             *
             * On error, the stylesheet will be removed to prevent issues later down the line.
             */
            #ensureCssAccess() {
              const targetDocument = this.targetDocument;
              targetDocument
                .querySelectorAll('link[rel="stylesheet"]')
                .forEach((link) => {
                  const sheet = [...targetDocument.styleSheets].find(
                    (s) => s.href === link.href
                  );
                  try {
                    sheet.cssRules; // Attempt to access cssRules
                    return; // Skip this stylesheet since read access is available
                  } catch {}
                  try {
                    // Fetch the CSS content synchronously using XMLHttpRequest
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", link.href, false);
                    xhr.send();
                    if (xhr.status === 200) {
                      const style = document.createElement("style");
                      style.textContent = xhr.responseText;
                      link.replaceWith(style); // Replace <link> with <style>
                    } else {
                      console.error(
                        `Failed to fetch ${link.href}: HTTP ${xhr.status}`
                      );
                    }
                  } catch (error) {
                    console.error(
                      `PaginateJS is unable to access stylesheet rules from ${link.href}, likely due to CORS restrictions.`,
                      "Ensure that the external stylesheets have the correct `Access-Control-Allow-Origin` header set on the server to allow JavaScript to read the CSS rules.",
                      "Network/Browser error details:",
                      error
                    );
                    link.remove();
                  }
                });
            }

            /**
             * Convert external stylesheets into inline styles in order to process them better
             *
             * Requires css read access for JS in order to be able reading stylesheets
             */
            #convertExternalStyleSheetsInline() {
              let cssText = "";
              const externalStylesheets = [
                ...this.targetDocument.styleSheets,
              ].filter((sheet) => sheet.href);
              externalStylesheets.forEach((styleSheet) => {
                try {
                  cssText = "";
                  Array.from(styleSheet.cssRules).forEach((rule) => {
                    cssText += rule.cssText + "\n";
                  });

                  // Insert stlysheets inline
                  let newStyleTag = document.createElement("style");
                  newStyleTag.innerHTML = cssText;
                  const linkTag = styleSheet.ownerNode;
                  linkTag.parentNode.insertBefore(newStyleTag, linkTag);
                } catch (e) {
                  console.error(
                    `Could not access and replace stylesheet: ${styleSheet.href}`,
                    e
                  );
                }
              });

              // Remove the external stylesheet after replacing,
              // ensureing even if the stylesheet was not accessible, it will be removed
              this.targetDocument
                .querySelectorAll("link[rel='stylesheet']")
                .forEach((styleTag) => {
                  styleTag.remove();
                });
            }

            /**
             * Moves all styles and stylesheets to the head of the document.
             * This is necessary to ensure that styles won't be copied with the paged content.
             * In addition, it will ensure that all styles keep beeing applied after edits document.styleSheets
             */
            #moveStylesToHead() {
              const head = this.targetDocument.head;
              const stylesAndLinks = this.targetDocument.querySelectorAll(
                'style, link[rel="stylesheet"]'
              );
              stylesAndLinks.forEach((element) => {
                if (!head.contains(element)) {
                  head.appendChild(element);
                }
              });
            }

            /**
             * Replaces viewport width (vw) and height (vh) with absolute pixel values.
             *
             * @param {string} string - The CSS string to convert.
             * @return {string} - The converted CSS string with vw and vh replaced by px.
             */
            #replaceViewportSizeWithAbsolute(string) {
              const convertedStyle = string.replace(
                /(-?\d+|-?\d*\.\d+)(vw|vh)/g,
                (match, value, unit) => {
                  const numericValue = parseFloat(value);
                  let pxValue;
                  if (unit === "vw") {
                    pxValue = (numericValue / 100) * 1080; // Convert vw to px
                  } else if (unit === "vh") {
                    pxValue = (numericValue / 100) * 720; // Convert vh to px
                  }
                  return `${Math.round(pxValue)}px`; // Replace with pixel value
                }
              );
              return convertedStyle;
            }

            /**
             * Replaces VW or VH with fixed height or width in order to prevent relative sizes
             */
            #replaceInvalidStyleRules() {
              let start_time = performance.now();
              const targetDocument = this.parentElement.ownerDocument;

              // Check all elements with style attribute
              targetDocument.querySelectorAll("[style]").forEach((element) => {
                let style = element.getAttribute("style");
                style = this.#replaceViewportSizeWithAbsolute(style);
                element.setAttribute("style", style);
              });

              // Check all stylesheets and replace invalid rules for PaginateJS
              Array.from(targetDocument.styleSheets).forEach((styleSheet) => {
                try {
                  for (let i = 0; i < styleSheet.cssRules.length; i++) {
                    this.#recursiveRemoveRules(styleSheet, i); // Call the function for each rule
                  }
                  // Array.from(styleSheet.cssRules).forEach((rule) => {
                  //   this.#recursiveRemoveRules2(styleSheet, rule);
                  // });
                } catch (e) {
                  console.log(e);
                  console.error(
                    `Could not access stylesheet: ${styleSheet.href}`,
                    e
                  );
                }
              });
              let end_time = performance.now();
              console.log(
                `PaginateJS: Replaced vw/vh with absolute values in ${
                  end_time - start_time
                }ms`
              );
            }
            #recursiveRemoveRules(styleSheet, ruleIndex) {
              // Ensure rule exists
              let rule = styleSheet.cssRules[ruleIndex];
              // console.log("MAIN: Processing rule:", rule?.cssText);
              if (!rule) return;
              const vwRegex = /(\d+(\.\d+)?)vw/g;
              const vhRegex = /(\d+(\.\d+)?)vh/g;
              if (rule.media && rule.type === CSSRule.MEDIA_RULE) {
                // Insert inner rules right after the media rule
                Array.from(rule.cssRules).forEach((innerRule, i) => {
                  styleSheet.insertRule(innerRule.cssText, ruleIndex + i + 1);
                });

                // Remove the original media rule
                styleSheet.deleteRule(ruleIndex);

                //

                // // Extract inner styles without modifying the original rule
                // let innerStyles = "";
                // for (let i = 0; i < rule.cssRules.length; i++) {
                //   innerStyles += rule.cssRules[i].cssText + "\n";
                // }

                // // Create a new media rule with the desired media condition
                // let newRuleText = `@media screen { ${innerStyles} }`;

                // // Remove old rule and insert new one
                // styleSheet.deleteRule(ruleIndex);
                // styleSheet.insertRule(newRuleText, ruleIndex);

                //

                // Re-fetch the rule after insertion
                rule = styleSheet.cssRules[ruleIndex];
                // console.log("Refetched rule:", rule?.cssText);

                // // Differentiate between print, dark mode, etc.
                // const mediaText = rule.media.mediaText.toLowerCase();
                // if (mediaText.includes("print")) {
                //   styleSheet.deleteRule(ruleIndex);
                // } else if (/min-width|max-width/.test(mediaText)) {
                //   styleSheet.deleteRule(ruleIndex);
                // }
              }
              if (rule.style) {
                for (let i = 0; i < rule.style.length; i++) {
                  let property = rule.style[i];
                  let value = rule.style.getPropertyValue(property);

                  // Convert `vw` to pixels
                  if (value.includes("vw") || value.includes("vh")) {
                    value = this.#replaceViewportSizeWithAbsolute(value);
                    rule.style.setProperty(property, value);
                  }
                }
              }
              // Recursively check for nested rules
              if (rule.cssRules) {
                // console.log("Parent rule:", rule.cssText);
                for (let i = 0; i < rule.cssRules.length; i++) {
                  // console.log(
                  //   "Processing nested rule:",
                  //   rule.cssRules[i].cssText
                  // );
                  this.#recursiveRemoveRules(rule, i);
                }
              }
              return;

              // else if (rule.style) {
              //   console.log("Processing rule:", rule.cssText);
              //   for (let i = 0; i < rule.style.length; i++) {
              //     let property = rule.style[i];
              //     let value = rule.style.getPropertyValue(property);
              //     if (vwRegex.test(value)) {
              //       let updatedValue = value.replace(
              //         vwRegex,
              //         (match, num) => `calc(${num} * 0.01 * 1000px)`
              //       );
              //       rule.style.setProperty(property, updatedValue);
              //     }
              //     if (vhRegex.test(value)) {
              //       let updatedValue = value.replace(
              //         vhRegex,
              //         (match, num) => `calc(${num} * 0.01 * 1000px)`
              //       );
              //       rule.style.setProperty(property, updatedValue);
              //     }
              //   }
              // }
            }
            #recursiveRemoveRules2(styleSheet, rule) {
              // TODO: Add way to remove/edit rules

              const vwRegex = /(\d+(\.\d+)?)vw/g;
              const vhRegex = /(\d+(\.\d+)?)vh/g;
              if (rule.media && rule.type === CSSRule.MEDIA_RULE) {
                // Create a new media rule using `@media screen`
                let newRuleText = `@media screen { ${rule.cssText.replace(
                  rule.media.mediaText,
                  ""
                )} }`;

                // Remove old rule and insert new one
                // styleSheet.deleteRule(i);
                // styleSheet.insertRule(newRuleText, i);

                // Maybe differentiate between print, dark mode, etc. ?

                // const mediaText = rule.media.mediaText.toLowerCase();
                // if (mediaText === "print") {
                //   styleSheet.deleteRule(rule);
                // } else if (/min-width|max-width/.test(mediaText)) {
                //   styleSheet.deleteRule(rule);
                // }
              }
              if (rule.style) {
                for (const style of rule.style) {
                  let value = rule.style.getPropertyValue(style);

                  // Convert `vw` to pixels
                  if (value.includes("vw")) {
                    let vwValue = parseFloat(value);
                    let pixelValue = (vwValue / 100) * viewportWidth;
                    rule.style.setProperty(property, `${pixelValue}px`);
                  }

                  // Convert `vh` to pixels
                  if (value.includes("vh")) {
                    let vhValue = parseFloat(value);
                    let pixelValue = (vhValue / 100) * viewportHeight;
                    rule.style.setProperty(property, `${pixelValue}px`);
                  }
                }
              }

              // Recursively check for nested rules
              if (rule.cssRules) {
                for (const subRule of rule.cssRules) {
                  this.#recursiveRemoveRules(styleSheet, subRule);
                }
              }

              // else if (rule.style) {
              //   console.log("Processing rule:", rule.cssText);
              //   for (let i = 0; i < rule.style.length; i++) {
              //     let property = rule.style[i];
              //     let value = rule.style.getPropertyValue(property);
              //     if (vwRegex.test(value)) {
              //       let updatedValue = value.replace(
              //         vwRegex,
              //         (match, num) => `calc(${num} * 0.01 * 1000px)`
              //       );
              //       rule.style.setProperty(property, updatedValue);
              //     }
              //     if (vhRegex.test(value)) {
              //       let updatedValue = value.replace(
              //         vhRegex,
              //         (match, num) => `calc(${num} * 0.01 * 1000px)`
              //       );
              //       rule.style.setProperty(property, updatedValue);
              //     }
              //   }
              // }
            }
            #removeMediaPrintRules() {
              this.#ensureCssAccess();
              const targetDocument = this.parentElement.ownerDocument;
              // Prevent @media print rules
              // Loop through all style sheets
              for (let i = targetDocument.styleSheets.length - 1; i >= 0; i--) {
                const styleSheet = targetDocument.styleSheets[i];
                try {
                  // Loop through the CSS rules in the stylesheet
                  for (let j = styleSheet.cssRules.length - 1; j >= 0; j--) {
                    const rule = styleSheet.cssRules[j];
                    if (!rule.media) {
                      // If the rule is not a media rule, continue to the next rule
                      continue;
                    }
                    const mediaText = rule.media.mediaText.toLowerCase();
                    if (mediaText === "print") {
                      styleSheet.deleteRule(j);
                    } else if (/min-width|max-width/.test(mediaText)) {
                      styleSheet.deleteRule(j);
                    }
                  }
                } catch (e) {
                  // Catch SecurityError for cross-origin stylesheets
                  console.error(
                    `Unable to access rules in stylesheet: ${styleSheet.href}`
                  );
                }
              }

              // Handle inline styles
              targetDocument
                .querySelectorAll("style")
                .forEach((styleElement) => {
                  const sheet = styleElement.sheet;
                  try {
                    for (let k = sheet.cssRules.length - 1; k >= 0; k--) {
                      if (
                        sheet.cssRules[k].media &&
                        sheet.cssRules[k].media.mediaText === "print"
                      ) {
                        sheet.deleteRule(k);
                      }
                    }
                  } catch (e) {
                    console.warn("Error processing inline style element:", e);
                  }
                });
            }
            #addPrintWrapper() {
              const wrapper = document.createElement("div");
              wrapper.classList.add("paginatejs", "paginatejs-pages");
              this.parentElement.appendChild(wrapper);
              this.wrapper = wrapper;
            }
            #addBasePrintStyles() {
              const style = document.createElement("style");
              style.innerHTML = `
          *, ::after, ::before {
            box-sizing: border-box;
          }
          paginate-source{
            display: none;
          }
          .paginatejs-pages {
            display: flex;
            flex-direction: column;
            gap: 0.5cm;
          }
          .page {
            width: 210mm;
            height: 297mm;
          }
          .page .header,
          .page .footer {
            width: 100%;
            height: 2cm;
          }
          .page .content {
            width: 100%;
            height: 100%;
          }
          @media print {
            .paginatejs * {
              break-after: unset !important;
              break-before: unset !important;
              break-inline: unset !important;
              page-break-after: unset !important;
              page-break-inside: unset !important;
              page-break-before: unset !important;
            }
            .paginatejs{
              gap: 0px;
            }
            
            .paginatejs .page{
              break-after: page;
            }
          }
      `;
              const targetDocument = this.parentElement.ownerDocument;
              targetDocument.head.insertBefore(
                style,
                targetDocument.head.firstChild
              );
            }
            #determinePageDimensions() {
              const offPage = document.createElement("div");
              offPage.classList.add("page", "default");
              offPage.style.position = "absolute";
              offPage.style.top = "-9999px";
              offPage.style.left = "-9999px";
              this.wrapper.appendChild(offPage);
              const height = offPage.offsetHeight;
              const width = offPage.offsetWidth;
              offPage.remove();
              this.pageHeight = height;
              this.pageWidth = width;
            }
            #setPrintPageSize() {
              const size =
                "size: " + this.pageWidth + "px " + this.pageHeight + "px;";
              const style = document.createElement("style");
              style.innerHTML = "@page{ " + size + " margin: 0}";
              const targetDocument = this.parentElement.ownerDocument;
              targetDocument.head.appendChild(style);
            }
          }

          /***/
        },

      /***/ "./src/objects/domlevelhandler.js":
        /*!****************************************!*\
  !*** ./src/objects/domlevelhandler.js ***!
  \****************************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ DomLevelHandler: () =>
              /* binding */ DomLevelHandler,
            /* harmony export */
          });
          class DomLevelHandler {
            constructor() {
              this.domLevels = [];
              this.target = null;
            }
            addToDomLevel(element) {
              let before = [];
              let after = [];

              // Add table header & footer as element too if required
              if (element.tagName === "TBODY") {
                this.#handleTables(before, element, after);
              }
              const level = {
                before: before,
                main: element,
                after: after,
              };
              this.domLevels.push(level);
            }
            #handleTables(before, element, after) {
              let prevSibling = element.previousElementSibling;
              let nextSibling = element.nextElementSibling;

              // Check for thead
              while (prevSibling) {
                if (prevSibling.tagName === "THEAD") {
                  var win = prevSibling.ownerDocument.defaultView;
                  const style = win.getComputedStyle(prevSibling);
                  if (style.display === "table-header-group") {
                    before.push(prevSibling);
                    break;
                  }
                }
                // Move to the next previous sibling
                prevSibling = prevSibling.previousElementSibling;
              }

              // TFOOT is not working yet, since it should be added on the current page already...
              // really special case here

              // // Check for tfoot
              // while (nextSibling) {
              //   if (nextSibling.tagName === "TFOOT") {
              //     const style = window.getComputedStyle(nextSibling);

              //     if (style.display === "table-footer-group") {
              //       after.push(nextSibling); // Add the tfoot element to the 'after' array
              //       break; // Exit the loop once the desired tfoot is found
              //     }
              //   }
              //   // Move to the next sibling
              //   nextSibling = nextSibling.nextElementSibling;
              // }
            }
            popLevel() {
              this.domLevels.pop();
            }
            renderLevels(page) {
              let target = page.content;
              this.domLevels.forEach((level) => {
                level.before.forEach((beforeElement) => {
                  target.appendChild(beforeElement.cloneNode(true));
                });
                const newTarget = level.main.cloneNode(false);
                target.appendChild(newTarget);
                level.after.forEach((afterElement) => {
                  target.appendChild(afterElement.cloneNode(true));
                });
                target = newTarget;
              });
              return target;
            }
          }

          /***/
        },

      /***/ "./src/objects/page.js":
        /*!*****************************!*\
  !*** ./src/objects/page.js ***!
  \*****************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Page: () => /* binding */ Page,
            /* harmony export */
          });
          class Page {
            /**
             * Creates a new page inside parent
             *
             * @param {HTMLElement} parent - Paginatejs wrapper
             * @param {int} pageWidth - Page width in px
             * @param {int} pageHeight - Page width in px
             * @param {string[]} [pageRange] - Current page range
             */
            constructor(parent, pageWidth, pageHeight, pageRange = []) {
              this.parent = parent;
              this.pageRange = pageRange;
              this.width = pageWidth;
              this.height = pageHeight;
              this.page = this.createPage();
            }

            /**
             * Creates an empty, new page element
             *
             * @returns {null}
             */
            createPage() {
              if (this.pageRange.length == 0) {
                this.pageRange.push("default");
              }
              const page = document.createElement("div");
              page.classList.add("page", ...this.pageRange);
              page.style.margin = "0";
              page.style.display = "flex";
              page.style.flexDirection = "column";
              page.style.overflow = "hidden";
              const header = document.createElement("div");
              header.classList.add("header");
              header.style.margin = "0";
              header.style.width = "100%";
              const content = document.createElement("div");
              content.classList.add("content");
              content.style.margin = "0";
              content.style.width = "100%";
              content.style.height = "unset";
              content.style.flexGrow = "1";
              const footer = document.createElement("div");
              footer.classList.add("footer");
              footer.style.margin = "0";
              footer.style.width = "100%";
              page.append(header, content, footer);
              this.parent.appendChild(page);

              // Set height explicitly in order to avoid accidental
              // changes after content has been added
              this.calculateAndLockHeights(page, header, content, footer);
              this.page = page;
              this.header = header;
              this.content = content;
              this.footer = footer;
            }

            /**
             * Calculates & locks the page heights of header, content and footer
             * in order to prevent accidental changes after content has been added
             *
             * @param {HTMLElement} page - The (empty) rendered page
             * @param {HTMLElement} header - The (empty) header element of the page
             * @param {HTMLElement} conten - The (empty) content element of the page
             * @param {HTMLElement} footer - The (empty) footer element of the page
             *
             * @returns {null}
             */
            calculateAndLockHeights(page, header, content, footer) {
              // const [pageWidth, pageHeight] = this.determinePagedimensions();

              page.style.width = this.width + "px";
              page.style.maxWidth = this.width + "px";
              page.style.height = this.height + "px";
              page.style.maxHeight = this.height + "px";
              const headerHeight = header.offsetHeight;
              header.style.height = headerHeight + "px";
              header.style.maxHeight = headerHeight + "px";
              const footerHeight = footer.offsetHeight;
              footer.style.height = footerHeight + "px";
              footer.style.maxHeight = footerHeight + "px";
              const contentHeight = content.offsetHeight;
              content.style.height = contentHeight + "px";
              content.style.maxHeight = contentHeight + "px";
              this.headerHeight = headerHeight;
              this.contentHeight = contentHeight;
              this.footerHeight = footerHeight;
            }
          }

          // getPageSize() {
          //   for (let stylesheet of document.styleSheets) {
          //     try {
          //       // Loop through the rules in the stylesheet
          //       for (let rule of stylesheet.cssRules) {
          //         // Check if the rule is an instance of CSSPageRule
          //
          //         // important: instanceof can't be used here (won't work in iframes)
          //         if (rule instanceof CSSPageRule) {
          //           // Extract the size property from the rule's style
          //           let size = rule.style.getPropertyValue("size");
          //           if (size) {
          //             console.log(`Pagesize: ${size}`);
          //             this.ensureValidPagesize(size);
          //             return size;
          //           }
          //         }
          //       }
          //     } catch (e) {
          //       // Handle potential cross-origin access errors
          //       console.warn(`Cannot access stylesheet: ${stylesheet.href}`, e);
          //     }
          //   }
          // }

          // /**
          //  * Returns valid pagesize or A4 pagesize if invalid.
          //  * @param {String} pagesize
          //  * @returns {width, height}
          //  */
          // ensureValidPagesize(pagesize) {
          //   //predefined page sizes in mm
          //   const presetSize = {
          //     A0: { height: 1189, width: 841 },
          //     A1: { height: 841, width: 594 },
          //     A2: { height: 594, width: 420 },
          //     A3: { height: 420, width: 297 },
          //     A4: { height: 297, width: 210 },
          //     A5: { height: 210, width: 148 },
          //     A6: { height: 148, width: 105 },
          //     A7: { height: 105, width: 74 },
          //     A8: { height: 74, width: 52 },
          //     A9: { height: 52, width: 37 },
          //     B0: { height: 1414, width: 1000 },
          //     B1: { height: 1000, width: 707 },
          //     B2: { height: 707, width: 500 },
          //     B3: { height: 500, width: 353 },
          //     B4: { height: 353, width: 250 },
          //     B5: { height: 250, width: 176 },
          //     B6: { height: 176, width: 125 },
          //     B7: { height: 125, width: 88 },
          //     B8: { height: 88, width: 62 },
          //     B9: { height: 62, width: 44 },
          //     B10: { height: 44, width: 31 },
          //     C5E: { height: 229, width: 163 },
          //     Comm10E: { height: 241, width: 105 },
          //     DLE: { height: 220, width: 110 },
          //     Executive: { height: 254, width: 291 },
          //     Folio: { height: 330, width: 210 },
          //     Ledger: { height: 432, width: 279 },
          //     Legal: { height: 356, width: 216 },
          //     Letter: { height: 279, width: 216 },
          //     Tabloid: { height: 432, width: 279 },
          //   };
          //   const customSizeRegex = /^\d+(\.\d+)?(cm|mm|in|px|pt|pc)$/;
          //   const words = pagesize.split(/\s+/);

          //   if (words.length == 0)
          //     presetSize["A4"].width + "mm", presetSize["A4"].height + "mm";

          //   // is valid orientation?
          //   let orientation = "portrait";
          //   if (words[words.length - 1].match(/\b(landscape|portrait)\b/i)) {
          //     orientation = words[words.length - 1];
          //     // remove orientation setting
          //     words.pop();
          //   }

          //   // preset Page size or empty
          //   if (
          //     (words.length == 1 || words.length == 2) &&
          //     presetSize.hasOwnProperty(words[0])
          //   ) {
          //     presetSize["A4"].width + "mm", presetSize["A4"].height + "mm";

          //     if (words.length == 2) {
          //       width = presetSize[words[0]].height;
          //       height = presetSize[words[0]].width;
          //     } else {
          //       width = presetSize[words[0]].width;
          //       height = presetSize[words[0]].height;
          //     }
          //     return width, height;
          //   }

          //   // 1 dimensional valid size?
          //   if (words.length == 0 && words[0].match(customSizeRegex)) {
          //     return words[0], words[0];
          //   }

          //   if (
          //     words.length == 2 &&
          //     words[0].match(customSizeRegex) &&
          //     words[1].match(customSizeRegex)
          //   ) {
          //     if (orientation === "landscape") {
          //       words[0];
          //     } else {
          //       width = presetSize[words[0]].width;
          //       height = presetSize[words[0]].height;
          //     }
          //     return width, height;
          //   }
          //   if (words.length > 0 && words[0].match(customSizeRegex)) {
          //     // Is there at least one valid custom size defined?
          //     // Check if there's a second size
          //     if (words.length == 2 && words[1].match(customSizeRegex)) {
          //     }
          //   }
          // }

          /***/
        },

      /***/ "./src/objects/renderer.js":
        /*!*********************************!*\
  !*** ./src/objects/renderer.js ***!
  \*********************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Renderer: () => /* binding */ Renderer,
            /* harmony export */
          });
          /* harmony import */ var _decorator__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ./decorator */ "./src/objects/decorator.js"
            );
          /* harmony import */ var _documentlayoutmanager__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ./documentlayoutmanager */ "./src/objects/documentlayoutmanager.js"
            );
          /* harmony import */ var _page__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__(/*! ./page */ "./src/objects/page.js");
          /* harmony import */ var _skeleton__WEBPACK_IMPORTED_MODULE_3__ =
            __webpack_require__(/*! ./skeleton */ "./src/objects/skeleton.js");
          /* harmony import */ var _utils_waitForRessources__WEBPACK_IMPORTED_MODULE_4__ =
            __webpack_require__(
              /*! ../utils/waitForRessources */ "./src/utils/waitForRessources.js"
            );
          /* harmony import */ var _domlevelhandler__WEBPACK_IMPORTED_MODULE_5__ =
            __webpack_require__(
              /*! ./domlevelhandler */ "./src/objects/domlevelhandler.js"
            );

          class Renderer {
            constructor(content, renderTo = document.body) {
              this.content = content;
              this.renderTo = renderTo;
              this.pages = [];

              // Current page targetElement to copy nodes into
              this.targetParent = this.page;
              // Dom depth which will be added in case of a page-break
              this.parentList = [];
              this.domLevelHandler =
                new _domlevelhandler__WEBPACK_IMPORTED_MODULE_5__.DomLevelHandler();

              // this.prepareTarget(renderTo);
              // this.newPage();
            }
            prepareTarget(renderTo) {
              this.layoutManager =
                new _documentlayoutmanager__WEBPACK_IMPORTED_MODULE_1__.DocumentLayoutManager(
                  renderTo
                );

              // Insert wrapper and base styles
              this.layoutManager.preparePrintLayout();
              this.renderTo = this.layoutManager.wrapper;

              // Add first page
              this.newPage();
            }
            render() {
              (0,
              _utils_waitForRessources__WEBPACK_IMPORTED_MODULE_4__.waitForResourcesReady)(
                this.content.ownerDocument
              );
              this.prepareTarget(this.renderTo);
              this.processContent();
              this.layoutManager.finishPrintLayout();
              new _decorator__WEBPACK_IMPORTED_MODULE_0__.Decorator(
                this.pages
              ).decorate();
            }

            /**
             * Processes the content of parent as a recursive function and distrubutes the content throughout all pages
             *
             * @param {Node} parentNode - parent of the current depth which will be processed into pages
             * @returns {null}
             */
            processContent(parentNode = this.content) {
              // iterate through all direct children
              for (let i = 0; i < parentNode.childNodes.length; i++) {
                const node = parentNode.childNodes[i];
                let avoidBreakInside = false;
                let breakBefore = false;
                let breakAfter = false;

                // important: instanceof can't be used here (won't work in iframes)
                if (node.nodeType === Node.ELEMENT_NODE) {
                  var win = node.ownerDocument.defaultView;
                  const style = win.getComputedStyle(node);
                  breakBefore = style.breakBefore === "page";
                  avoidBreakInside = style.breakInside === "avoid";
                  breakAfter = style.breakAfter === "page";
                }
                if (breakBefore) {
                  this.newPage();
                }
                if (node.hasChildNodes() && !avoidBreakInside) {
                  // increse current dom depth
                  // Add node shallow again
                  let newParent = node.cloneNode(false);
                  this.targetParent.appendChild(newParent);
                  this.targetParent = newParent;
                  // this.parentList.push(node);
                  this.domLevelHandler.addToDomLevel(node);
                  this.processContent(node);

                  // remove current dom depth
                  this.domLevelHandler.popLevel();
                  // this.parentList.pop();
                  this.targetParent = this.targetParent.parentNode;

                  // In case there is none, There has been a page-break and the children are on the new page.
                  // -> No need to render the (empty) wrapping parent in this case then..
                  if (!newParent.hasChildNodes()) {
                    newParent.remove();
                  }
                } else {
                  let height = this.insertAndCheckNode(node);
                  if (height > this.currentPage.contentHeight) {
                    // Remove overflowing node
                    this.removeLastChildNode();

                    // There's no further way to break down the children, we create a Break page
                    this.newPage();

                    // Re-insert this node
                    let height = this.insertAndCheckNode(node);

                    // Still overflowing? Element can't be broken even more... MAYDAY :)
                    if (height > this.currentPage.contentHeight) {
                      console.log(
                        "Element cannot be rendered to page, does overflow by itself..." +
                          node.textContent
                      );
                    }
                  }
                }
                if (breakAfter) {
                  this.newPage();
                }
              }
            }
            insertAndCheckNode(node) {
              this.targetParent.appendChild(node.cloneNode(true));
              return this.currentPage.content.scrollHeight;
            }
            newPage() {
              const page = this.layoutManager.insertPage();
              this.pages.push(page);
              this.currentPage = page;

              // Create current domtree
              this.targetParent = this.currentPage.content;
              this.targetParent = this.domLevelHandler.renderLevels(page);

              // this.parentList.forEach((node) => {
              //   let newNode = node.cloneNode(false);
              //   this.targetParent.appendChild(newNode);
              //   this.targetParent = newNode;
              // });
            }
            removeLastChildNode() {
              if (this.targetParent.lastChild) {
                // Removes the last child, including text nodes
                this.targetParent.removeChild(this.targetParent.lastChild);
              }
            }
          }

          /***/
        },

      /***/ "./src/objects/skeleton.js":
        /*!*********************************!*\
  !*** ./src/objects/skeleton.js ***!
  \*********************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Skeleton: () => /* binding */ Skeleton,
            /* harmony export */
          });
          /**
           * PaginateWrapper is responsible for general tasks such as:
           * - Generate base wrapper for paginate.js pages
           * - Insert base css required for paginate.js
           * - Add media print settings for paginate.js
           */
          class Skeleton {
            constructor(renderTo) {
              this.renderTo = renderTo;
            }
            insertPageWrapper() {
              const wrapper = document.createElement("div");
              wrapper.classList.add("paginatejs", "paginatejs-pages");
              return wrapper;
            }
            calculatePageSize() {}

            /** Possible approach:
             * - AddPageWrapper will calculate page dimensions
             * - And insert media rules too at the end of the header
             * - New pages will be required to add throughout skeleton class
             *
             * Approach two:
             * - Renderer is tightly bound to skeleton and will calculate e.g. all throughout skeleton
             *
             * Add layoutAnalyzer or StyleResolver, which will analyze the layout
             */

            static getBaseStyleElement() {
              const style = document.createElement("style");
              style.innerHTML = `
          *, ::after, ::before {
            box-sizing: border-box;
          }
          .paginatejs-pages {
            display: flex;
            flex-direction: column;
            gap: 0.5cm;
          }
          .page {
            width: 210mm;
            height: 297mm;
          }
          .page .header,
          .page .footer {
            width: 100%;
            height: 2cm;
          }
          .page .content {
            width: 100%;
            height: 100%;
          }
          @media print {
            .paginatejs * {
              break-after: unset !important;
              break-before: unset !important;
              break-inline: unset !important;
            }
            .paginatejs{
              gap: 0px;
            }
          }
        `;
              return style;
            }

            /**
             *
             * @param {string} pageWidth - Page width
             * @param {string} pageHeight - Page height
             * @param {HTMLElement} pageWrapper - Paginate.jd page wrapper Element
             *
             * @returns {HTMLElement} mediaStyles
             */
            static getPrintMediaStyles(pageWidth, pageHeight, pageWrapper) {}
            static getPagesWrapper() {
              const wrapper = document.createElement("div");
              wrapper.classList.add("paginatejs", "paginatejs-pages");
              return wrapper;
            }
          }

          /***/
        },

      /***/ "./src/utils/waitForRessources.js":
        /*!****************************************!*\
  !*** ./src/utils/waitForRessources.js ***!
  \****************************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ waitForResourcesReady: () =>
              /* binding */ waitForResourcesReady,
            /* harmony export */
          });
          /**
           * Waits for all resources (images, etc.) to be fully loaded.
           */
          async function waitForResourcesReady(doc = document) {
            while (doc.readyState !== "complete") {
              await new Promise((resolve) =>
                // must be made iframe-save
                doc.defaultView.addEventListener("load", resolve, {
                  once: true,
                })
              );
            }
          }

          /***/
        },

      /******/
    };
    /************************************************************************/
    /******/ // The module cache
    /******/ var __webpack_module_cache__ = {};
    /******/
    /******/ // The require function
    /******/ function __webpack_require__(moduleId) {
      /******/ // Check if module is in cache
      /******/ var cachedModule = __webpack_module_cache__[moduleId];
      /******/ if (cachedModule !== undefined) {
        /******/ return cachedModule.exports;
        /******/
      }
      /******/ // Create a new module (and put it into the cache)
      /******/ var module = (__webpack_module_cache__[moduleId] = {
        /******/ // no module.id needed
        /******/ // no module.loaded needed
        /******/ exports: {},
        /******/
      });
      /******/
      /******/ // Execute the module function
      /******/ __webpack_modules__[moduleId](
        module,
        module.exports,
        __webpack_require__
      );
      /******/
      /******/ // Return the exports of the module
      /******/ return module.exports;
      /******/
    }
    /******/
    /************************************************************************/
    /******/ /* webpack/runtime/define property getters */
    /******/ (() => {
      /******/ // define getter functions for harmony exports
      /******/ __webpack_require__.d = (exports, definition) => {
        /******/ for (var key in definition) {
          /******/ if (
            __webpack_require__.o(definition, key) &&
            !__webpack_require__.o(exports, key)
          ) {
            /******/ Object.defineProperty(exports, key, {
              enumerable: true,
              get: definition[key],
            });
            /******/
          }
          /******/
        }
        /******/
      };
      /******/
    })();
    /******/
    /******/ /* webpack/runtime/hasOwnProperty shorthand */
    /******/ (() => {
      /******/ __webpack_require__.o = (obj, prop) =>
        Object.prototype.hasOwnProperty.call(obj, prop);
      /******/
    })();
    /******/
    /******/ /* webpack/runtime/make namespace object */
    /******/ (() => {
      /******/ // define __esModule on exports
      /******/ __webpack_require__.r = (exports) => {
        /******/ if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
          /******/ Object.defineProperty(exports, Symbol.toStringTag, {
            value: "Module",
          });
          /******/
        }
        /******/ Object.defineProperty(exports, "__esModule", { value: true });
        /******/
      };
      /******/
    })();
    /******/
    /************************************************************************/
    var __webpack_exports__ = {};
    // This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
    (() => {
      /*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
      __webpack_require__.r(__webpack_exports__);
      /* harmony export */ __webpack_require__.d(__webpack_exports__, {
        /* harmony export */ Renderer: () =>
          /* reexport safe */ _objects_renderer_js__WEBPACK_IMPORTED_MODULE_0__.Renderer,
        /* harmony export */
      });
      /* harmony import */ var _objects_renderer_js__WEBPACK_IMPORTED_MODULE_0__ =
        __webpack_require__(
          /*! ./objects/renderer.js */ "./src/objects/renderer.js"
        );
    })();

    /******/ return __webpack_exports__;
    /******/
  })();
});
//# sourceMappingURL=paginate.js.map
