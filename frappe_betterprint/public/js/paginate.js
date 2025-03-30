/*! @license Paginatejs v1.0.0 | MIT License | (C) 2025 Neocode */
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
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
      /***/ "./src/index.js":
        /*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Renderer: () => (/* reexport safe */ _objects_renderer_js__WEBPACK_IMPORTED_MODULE_0__.Renderer)\n/* harmony export */ });\n/* harmony import */ var _objects_renderer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./objects/renderer.js */ "./src/objects/renderer.js");\n\n\n\n//# sourceURL=webpack://Paginate/./src/index.js?'
          );

          /***/
        },

      /***/ "./src/objects/decorator.js":
        /*!**********************************!*\
  !*** ./src/objects/decorator.js ***!
  \**********************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__
        ) => {
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Decorator: () => (/* binding */ Decorator)\n/* harmony export */ });\n/**\r\n * Decorator class will decorate all pages after rendering. It\'s main purpose:\r\n * - Parse betterprint elements\r\n * - Render Header / Footer content\r\n * - Add page numbers\r\n */\nclass Decorator {\n  constructor(pages) {\n    this.reservedKeys = ["pageNumber", "totalPages"];\n    this.pages = pages;\n  }\n  decorate() {\n    const sources = this.#parsePages(this.pages);\n    this.#renderHeader(sources);\n    this.#renderFooter(sources);\n  }\n  #renderHeader(sources) {\n    this.pages.forEach((page, i) => {\n      this.#renderPageHeader(page, sources[i - 1], sources[i], i + 1);\n    });\n  }\n  #renderPageHeader(page, prevSources, sources, pageNumber) {\n    // First page?\n    // Add first header found on page 1\n    if (pageNumber == 1) {\n      const firstHeader = page.content.querySelectorAll(\'paginate-source[data-key="header"]\')[0];\n      if (firstHeader) {\n        page.header.innerHTML = firstHeader.innerHTML;\n      }\n    } else {\n      // Else add current header if any\n      const header = prevSources[this.hash("header")];\n      if (header) {\n        page.header.innerHTML = header.innerHTML;\n      }\n    }\n\n    // If page isn\'t first one, set paginate source data to previous page,\n    // in order to allow the header to show past content only\n    const pageSource = pageNumber == 1 ? sources : prevSources;\n    let targets = page.header.querySelectorAll(\'paginate-target:not([data-status="solved"])\');\n\n    // Resolve targets until there is none left\n    while (targets.length) {\n      targets.forEach(target => {\n        const key = target.getAttribute("data-key") ?? "empty-key";\n\n        // Always take page numer from current page\n        if (key === "pageNumber" || key === "totalPages") {\n          target.innerHTML = sources[this.hash(key)]?.innerHTML ?? "";\n        }\n        // If key is header, this will cause a infinite loop\n        else if (key !== "header") {\n          target.innerHTML = pageSource[this.hash(key)]?.innerHTML ?? "";\n        }\n        target.setAttribute("data-status", "solved");\n      });\n      targets = page.header.querySelectorAll(\'paginate-target:not([data-status="solved"])\');\n    }\n  }\n  #renderFooter(sources) {\n    this.pages.forEach((page, i) => {\n      this.#renderPageFooter(page, sources[i]);\n    });\n  }\n  #renderPageFooter(page, sources) {\n    const footer = sources[this.hash("footer")];\n    if (footer) {\n      page.footer.innerHTML = footer.innerHTML;\n    }\n    let targets = page.footer.querySelectorAll(\'paginate-target:not([data-status="solved"])\');\n\n    // Resolve targets until there is none left\n    while (targets.length) {\n      targets.forEach(target => {\n        const key = target.getAttribute("data-key") ?? "empty-key";\n\n        // If key is header, this will cause a infinite loop\n        if (key !== "footer") {\n          target.innerHTML = sources[this.hash(key)]?.innerHTML ?? "";\n        }\n        target.setAttribute("data-status", "solved");\n      });\n      targets = page.footer.querySelectorAll(\'paginate-target:not([data-status="solved"])\');\n    }\n  }\n\n  /**\r\n   * Calculates the references of each page individually\r\n   * add default keys to the content like page numbers\r\n   * @param {list[Page]} pages\r\n   * @returns {Array referencePages}\r\n   */\n  #parsePages(pages) {\n    let referencePages = [];\n    let previousReferences = {};\n    for (let i = 0; i < pages.length; i++) {\n      let pagePreference = this.parseCurrentPage(pages[i]);\n\n      // add previous references to this page too\n      pagePreference = Object.assign({}, previousReferences, this.parseCurrentPage(pages[i]));\n\n      // Insert page to preferences list and update previousReference for next page\n      referencePages.push(pagePreference);\n      previousReferences = pagePreference;\n    }\n    this.insertPageNumberReference(referencePages);\n    return referencePages;\n  }\n\n  /**\r\n   * Searches current page for source content and generates a\r\n   * Object of every reference. References are a hash-value of the data-key attribute\r\n   *\r\n   *\r\n   * @param {Element} page - Page to search for source content\r\n   * @returns {Object references} references\r\n   */\n  parseCurrentPage(page) {\n    // This will fetch all source-elements in a recursive way, starting from the beinning of the page\n    const sources = page.content.querySelectorAll("paginate-source");\n    let references = {};\n    // Let\'s parse the sources and overrite existing ones\n    sources.forEach(source => {\n      // Get key of this source-element\n      const dataKey = source.getAttribute("data-key");\n\n      // Check if the key attribute exists and is not empty or reservedKey\n      if (dataKey && dataKey.trim() !== "" && !this.reservedKeys.includes(dataKey)) {\n        // create hash of dataKey in oder to prevent invalid Object keys\n        const hash = this.hash(dataKey);\n        references[hash] = source;\n      }\n    });\n    return references;\n  }\n\n  /**\r\n   * Insert page number references into each page references\r\n   *\r\n   * @param {Array} references\r\n   * @returns {null}\r\n   */\n  insertPageNumberReference(referencePages) {\n    const totalPages = document.createElement("span");\n    totalPages.innerHTML = referencePages.length;\n    const pageNumberHash = this.hash("pageNumber");\n    const totalPagesHash = this.hash("totalPages");\n    for (let i = 0; i < referencePages.length; i++) {\n      const pageNumber = document.createElement("span");\n      pageNumber.innerHTML = i + 1;\n      referencePages[i][pageNumberHash] = pageNumber;\n      referencePages[i][totalPagesHash] = totalPages;\n    }\n  }\n\n  /**\r\n   * Returns a hash code from a string\r\n   * Please note: not recommended for security applications! insecure.\r\n   *\r\n   * @param  {String} str The string to hash.\r\n   * @return {Number}    A 32bit integer\r\n   * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/\r\n   */\n  hash(str) {\n    let hash = 0;\n    for (let i = 0, len = str.length; i < len; i++) {\n      let chr = str.charCodeAt(i);\n      hash = (hash << 5) - hash + chr;\n      hash |= 0; // Convert to 32bit integer\n    }\n    return hash;\n  }\n}\n\n//# sourceURL=webpack://Paginate/./src/objects/decorator.js?'
          );

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
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DocumentLayoutManager: () => (/* binding */ DocumentLayoutManager)\n/* harmony export */ });\n/* harmony import */ var _page_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./page.js */ "./src/objects/page.js");\n\n/**\r\n * DocumentLayoutManager is responsible for general tasks such as:\r\n * - Generate base wrapper for paginate.js pages\r\n * - Insert base css required for paginate.js\r\n * - Add media print settings for paginate.js\r\n * - Responsible to calculate and create new pages with preset layout (size & style)\r\n */\nclass DocumentLayoutManager {\n  constructor(parentElement) {\n    this.parentElement = parentElement;\n  }\n  preparePrintLayout() {\n    this.#addPrintWrapper();\n    this.#removeMediaPrintRules();\n    this.#addBasePrintStyles();\n    this.#determinePageDimensions();\n    this.#setPrintPageSize();\n  }\n  finishPrintLayout() {\n    this.#adjustLastPage();\n  }\n  #adjustLastPage() {\n    const lastPage = this.wrapper.lastElementChild;\n    if (!lastPage) return;\n    lastPage.style.height = lastPage.offsetHeight - 2 + "px";\n    lastPage.style.maxHeight = lastPage.style.height;\n  }\n\n  /**\r\n   * Adds new page to the page wrapper\r\n   *\r\n   * @returns {Page} - new Page object\r\n   */\n  insertPage(pageRange = []) {\n    return new _page_js__WEBPACK_IMPORTED_MODULE_0__.Page(this.wrapper, this.pageWidth, this.pageHeight, pageRange);\n  }\n  #removeMediaPrintRules() {\n    const targetDocument = this.parentElement.ownerDocument;\n    // Prevent @media print rules\n    // Loop through all style sheets\n    for (let i = targetDocument.styleSheets.length - 1; i >= 0; i--) {\n      const styleSheet = targetDocument.styleSheets[i];\n      try {\n        // Loop through the CSS rules in the stylesheet\n        for (let j = styleSheet.cssRules.length - 1; j >= 0; j--) {\n          if (styleSheet.cssRules[j].media && styleSheet.cssRules[j].media.mediaText === "print") {\n            styleSheet.deleteRule(j);\n          }\n        }\n      } catch (e) {\n        // Catch SecurityError for cross-origin stylesheets\n        console.warn(`Unable to access rules in stylesheet: ${styleSheet.href}`);\n      }\n    }\n\n    // Handle inline styles\n    targetDocument.querySelectorAll("style").forEach(styleElement => {\n      const sheet = styleElement.sheet;\n      try {\n        for (let k = sheet.cssRules.length - 1; k >= 0; k--) {\n          if (sheet.cssRules[k].media && sheet.cssRules[k].media.mediaText === "print") {\n            sheet.deleteRule(k);\n          }\n        }\n      } catch (e) {\n        console.warn("Error processing inline style element:", e);\n      }\n    });\n  }\n  #addPrintWrapper() {\n    const wrapper = document.createElement("div");\n    wrapper.classList.add("paginatejs", "paginatejs-pages");\n    this.parentElement.appendChild(wrapper);\n    this.wrapper = wrapper;\n  }\n  #addBasePrintStyles() {\n    const style = document.createElement("style");\n    style.innerHTML = `\n          *, ::after, ::before {\n            box-sizing: border-box;\n          }\n          paginate-source{\n            display: none;\n          }\n          .paginatejs-pages {\n            display: flex;\n            flex-direction: column;\n            gap: 0.5cm;\n          }\n          .page {\n            width: 210mm;\n            height: 297mm;\n          }\n          .page .header,\n          .page .footer {\n            width: 100%;\n            height: 2cm;\n          }\n          .page .content {\n            width: 100%;\n            height: 100%;\n          }\n          @media print {\n            .paginatejs * {\n              break-after: unset !important;\n              break-before: unset !important;\n              break-inline: unset !important;\n            }\n            .paginatejs{\n              gap: 0px;\n            }\n            \n            .paginatejs .page{\n              break-after: always;\n            }\n          }\n      `;\n    const targetDocument = this.parentElement.ownerDocument;\n    targetDocument.head.insertBefore(style, targetDocument.head.firstChild);\n  }\n  #determinePageDimensions() {\n    const offPage = document.createElement("div");\n    offPage.classList.add("page", "default");\n    offPage.style.position = "absolute";\n    offPage.style.top = "-9999px";\n    offPage.style.left = "-9999px";\n    this.wrapper.appendChild(offPage);\n    const height = offPage.offsetHeight;\n    const width = offPage.offsetWidth;\n    offPage.remove();\n    this.pageHeight = height;\n    this.pageWidth = width;\n  }\n  #setPrintPageSize() {\n    const size = "size: " + this.pageWidth + "px " + this.pageHeight + "px;";\n    const style = document.createElement("style");\n    style.innerHTML = "@page{ " + size + " margin: 0}";\n    const targetDocument = this.parentElement.ownerDocument;\n    targetDocument.head.appendChild(style);\n  }\n}\n\n//# sourceURL=webpack://Paginate/./src/objects/documentlayoutmanager.js?'
          );

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
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DomLevelHandler: () => (/* binding */ DomLevelHandler)\n/* harmony export */ });\nclass DomLevelHandler {\n  constructor() {\n    this.domLevels = [];\n    this.target = null;\n  }\n  addToDomLevel(element) {\n    let before = [];\n    let after = [];\n\n    // Add table header & footer as element too if required\n    if (element.tagName === "TBODY") {\n      this.#handleTables(before, element, after);\n    }\n    const level = {\n      before: before,\n      main: element,\n      after: after\n    };\n    this.domLevels.push(level);\n  }\n  #handleTables(before, element, after) {\n    let prevSibling = element.previousElementSibling;\n    let nextSibling = element.nextElementSibling;\n\n    // Check for thead\n    while (prevSibling) {\n      if (prevSibling.tagName === "THEAD") {\n        var win = prevSibling.ownerDocument.defaultView;\n        const style = win.getComputedStyle(prevSibling);\n        if (style.display === "table-header-group") {\n          before.push(prevSibling);\n          break;\n        }\n      }\n      // Move to the next previous sibling\n      prevSibling = prevSibling.previousElementSibling;\n    }\n\n    // TFOOT is not working yet, since it should be added on the current page already...\n    // really special case here\n\n    // // Check for tfoot\n    // while (nextSibling) {\n    //   if (nextSibling.tagName === "TFOOT") {\n    //     const style = window.getComputedStyle(nextSibling);\n\n    //     if (style.display === "table-footer-group") {\n    //       after.push(nextSibling); // Add the tfoot element to the \'after\' array\n    //       break; // Exit the loop once the desired tfoot is found\n    //     }\n    //   }\n    //   // Move to the next sibling\n    //   nextSibling = nextSibling.nextElementSibling;\n    // }\n  }\n  popLevel() {\n    this.domLevels.pop();\n  }\n  renderLevels(page) {\n    let target = page.content;\n    this.domLevels.forEach(level => {\n      level.before.forEach(beforeElement => {\n        target.appendChild(beforeElement.cloneNode(true));\n      });\n      const newTarget = level.main.cloneNode(false);\n      target.appendChild(newTarget);\n      level.after.forEach(afterElement => {\n        target.appendChild(afterElement.cloneNode(true));\n      });\n      target = newTarget;\n    });\n    return target;\n  }\n}\n\n//# sourceURL=webpack://Paginate/./src/objects/domlevelhandler.js?'
          );

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
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Page: () => (/* binding */ Page)\n/* harmony export */ });\nclass Page {\n  /**\r\n   * Creates a new page inside parent\r\n   *\r\n   * @param {HTMLElement} parent - Paginatejs wrapper\r\n   * @param {int} pageWidth - Page width in px\r\n   * @param {int} pageHeight - Page width in px\r\n   * @param {string[]} [pageRange] - Current page range\r\n   */\n  constructor(parent, pageWidth, pageHeight, pageRange = []) {\n    this.parent = parent;\n    this.pageRange = pageRange;\n    this.width = pageWidth;\n    this.height = pageHeight;\n    this.page = this.createPage();\n  }\n\n  /**\r\n   * Creates an empty, new page element\r\n   *\r\n   * @returns {null}\r\n   */\n  createPage() {\n    if (this.pageRange.length == 0) {\n      this.pageRange.push("default");\n    }\n    const page = document.createElement("div");\n    page.classList.add("page", ...this.pageRange);\n    page.style.margin = "0";\n    page.style.display = "flex";\n    page.style.flexDirection = "column";\n    page.style.overflow = "hidden";\n    const header = document.createElement("div");\n    header.classList.add("header");\n    header.style.margin = "0";\n    header.style.width = "100%";\n    const content = document.createElement("div");\n    content.classList.add("content");\n    content.style.margin = "0";\n    content.style.width = "100%";\n    content.style.height = "unset";\n    content.style.flexGrow = "1";\n    const footer = document.createElement("div");\n    footer.classList.add("footer");\n    footer.style.margin = "0";\n    footer.style.width = "100%";\n    page.append(header, content, footer);\n    this.parent.appendChild(page);\n\n    // Set height explicitly in order to avoid accidental\n    // changes after content has been added\n    this.calculateAndLockHeights(page, header, content, footer);\n    this.page = page;\n    this.header = header;\n    this.content = content;\n    this.footer = footer;\n  }\n\n  /**\r\n   * Calculates & locks the page heights of header, content and footer\r\n   * in order to prevent accidental changes after content has been added\r\n   *\r\n   * @param {HTMLElement} page - The (empty) rendered page\r\n   * @param {HTMLElement} header - The (empty) header element of the page\r\n   * @param {HTMLElement} conten - The (empty) content element of the page\r\n   * @param {HTMLElement} footer - The (empty) footer element of the page\r\n   *\r\n   * @returns {null}\r\n   */\n  calculateAndLockHeights(page, header, content, footer) {\n    // const [pageWidth, pageHeight] = this.determinePagedimensions();\n\n    page.style.width = this.width + "px";\n    page.style.maxWidth = this.width + "px";\n    page.style.height = this.height + "px";\n    page.style.maxHeight = this.height + "px";\n    const headerHeight = header.offsetHeight;\n    header.style.height = headerHeight + "px";\n    header.style.maxHeight = headerHeight + "px";\n    const footerHeight = footer.offsetHeight;\n    footer.style.height = footerHeight + "px";\n    footer.style.maxHeight = footerHeight + "px";\n    const contentHeight = content.offsetHeight;\n    content.style.height = contentHeight + "px";\n    content.style.maxHeight = contentHeight + "px";\n    this.headerHeight = headerHeight;\n    this.contentHeight = contentHeight;\n    this.footerHeight = footerHeight;\n  }\n}\n\n// getPageSize() {\n//   for (let stylesheet of document.styleSheets) {\n//     try {\n//       // Loop through the rules in the stylesheet\n//       for (let rule of stylesheet.cssRules) {\n//         // Check if the rule is an instance of CSSPageRule\n//\n//         // important: instanceof can\'t be used here (won\'t work in iframes)\n//         if (rule instanceof CSSPageRule) {\n//           // Extract the size property from the rule\'s style\n//           let size = rule.style.getPropertyValue("size");\n//           if (size) {\n//             console.log(`Pagesize: ${size}`);\n//             this.ensureValidPagesize(size);\n//             return size;\n//           }\n//         }\n//       }\n//     } catch (e) {\n//       // Handle potential cross-origin access errors\n//       console.warn(`Cannot access stylesheet: ${stylesheet.href}`, e);\n//     }\n//   }\n// }\n\n// /**\n//  * Returns valid pagesize or A4 pagesize if invalid.\n//  * @param {String} pagesize\n//  * @returns {width, height}\n//  */\n// ensureValidPagesize(pagesize) {\n//   //predefined page sizes in mm\n//   const presetSize = {\n//     A0: { height: 1189, width: 841 },\n//     A1: { height: 841, width: 594 },\n//     A2: { height: 594, width: 420 },\n//     A3: { height: 420, width: 297 },\n//     A4: { height: 297, width: 210 },\n//     A5: { height: 210, width: 148 },\n//     A6: { height: 148, width: 105 },\n//     A7: { height: 105, width: 74 },\n//     A8: { height: 74, width: 52 },\n//     A9: { height: 52, width: 37 },\n//     B0: { height: 1414, width: 1000 },\n//     B1: { height: 1000, width: 707 },\n//     B2: { height: 707, width: 500 },\n//     B3: { height: 500, width: 353 },\n//     B4: { height: 353, width: 250 },\n//     B5: { height: 250, width: 176 },\n//     B6: { height: 176, width: 125 },\n//     B7: { height: 125, width: 88 },\n//     B8: { height: 88, width: 62 },\n//     B9: { height: 62, width: 44 },\n//     B10: { height: 44, width: 31 },\n//     C5E: { height: 229, width: 163 },\n//     Comm10E: { height: 241, width: 105 },\n//     DLE: { height: 220, width: 110 },\n//     Executive: { height: 254, width: 291 },\n//     Folio: { height: 330, width: 210 },\n//     Ledger: { height: 432, width: 279 },\n//     Legal: { height: 356, width: 216 },\n//     Letter: { height: 279, width: 216 },\n//     Tabloid: { height: 432, width: 279 },\n//   };\n//   const customSizeRegex = /^\\d+(\\.\\d+)?(cm|mm|in|px|pt|pc)$/;\n//   const words = pagesize.split(/\\s+/);\n\n//   if (words.length == 0)\n//     presetSize["A4"].width + "mm", presetSize["A4"].height + "mm";\n\n//   // is valid orientation?\n//   let orientation = "portrait";\n//   if (words[words.length - 1].match(/\\b(landscape|portrait)\\b/i)) {\n//     orientation = words[words.length - 1];\n//     // remove orientation setting\n//     words.pop();\n//   }\n\n//   // preset Page size or empty\n//   if (\n//     (words.length == 1 || words.length == 2) &&\n//     presetSize.hasOwnProperty(words[0])\n//   ) {\n//     presetSize["A4"].width + "mm", presetSize["A4"].height + "mm";\n\n//     if (words.length == 2) {\n//       width = presetSize[words[0]].height;\n//       height = presetSize[words[0]].width;\n//     } else {\n//       width = presetSize[words[0]].width;\n//       height = presetSize[words[0]].height;\n//     }\n//     return width, height;\n//   }\n\n//   // 1 dimensional valid size?\n//   if (words.length == 0 && words[0].match(customSizeRegex)) {\n//     return words[0], words[0];\n//   }\n\n//   if (\n//     words.length == 2 &&\n//     words[0].match(customSizeRegex) &&\n//     words[1].match(customSizeRegex)\n//   ) {\n//     if (orientation === "landscape") {\n//       words[0];\n//     } else {\n//       width = presetSize[words[0]].width;\n//       height = presetSize[words[0]].height;\n//     }\n//     return width, height;\n//   }\n//   if (words.length > 0 && words[0].match(customSizeRegex)) {\n//     // Is there at least one valid custom size defined?\n//     // Check if there\'s a second size\n//     if (words.length == 2 && words[1].match(customSizeRegex)) {\n//     }\n//   }\n// }\n\n//# sourceURL=webpack://Paginate/./src/objects/page.js?'
          );

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
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Renderer: () => (/* binding */ Renderer)\n/* harmony export */ });\n/* harmony import */ var _decorator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./decorator */ "./src/objects/decorator.js");\n/* harmony import */ var _documentlayoutmanager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./documentlayoutmanager */ "./src/objects/documentlayoutmanager.js");\n/* harmony import */ var _page__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./page */ "./src/objects/page.js");\n/* harmony import */ var _skeleton__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./skeleton */ "./src/objects/skeleton.js");\n/* harmony import */ var _utils_waitForRessources__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/waitForRessources */ "./src/utils/waitForRessources.js");\n/* harmony import */ var _domlevelhandler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./domlevelhandler */ "./src/objects/domlevelhandler.js");\n\n\n\n\n\n\nclass Renderer {\n  constructor(content, renderTo = document.body) {\n    this.content = content;\n    this.renderTo = renderTo;\n    this.pages = [];\n\n    // Current page targetElement to copy nodes into\n    this.targetParent = this.page;\n    // Dom depth which will be added in case of a page-break\n    this.parentList = [];\n    this.domLevelHandler = new _domlevelhandler__WEBPACK_IMPORTED_MODULE_5__.DomLevelHandler();\n\n    // this.prepareTarget(renderTo);\n    // this.newPage();\n  }\n  prepareTarget(renderTo) {\n    this.layoutManager = new _documentlayoutmanager__WEBPACK_IMPORTED_MODULE_1__.DocumentLayoutManager(renderTo);\n\n    // Insert wrapper and base styles\n    this.layoutManager.preparePrintLayout();\n    this.renderTo = this.layoutManager.wrapper;\n\n    // Add first page\n    this.newPage();\n  }\n  render() {\n    (0,_utils_waitForRessources__WEBPACK_IMPORTED_MODULE_4__.waitForResourcesReady)();\n    this.prepareTarget(this.renderTo);\n    this.processContent();\n    this.layoutManager.finishPrintLayout();\n    new _decorator__WEBPACK_IMPORTED_MODULE_0__.Decorator(this.pages).decorate();\n  }\n\n  /**\r\n   * Processes the content of parent as a recursive function and distrubutes the content throughout all pages\r\n   *\r\n   * @param {Node} parentNode - parent of the current depth which will be processed into pages\r\n   * @returns {null}\r\n   */\n  processContent(parentNode = this.content) {\n    // iterate through all direct children\n    for (let i = 0; i < parentNode.childNodes.length; i++) {\n      const node = parentNode.childNodes[i];\n      let breakInside = false;\n      let breakBefore = false;\n      let breakAfter = false;\n\n      // important: instanceof can\'t be used here (won\'t work in iframes)\n      if (node.nodeType === Node.ELEMENT_NODE) {\n        var win = node.ownerDocument.defaultView;\n        const style = win.getComputedStyle(node);\n        breakBefore = style.breakBefore === "always";\n        breakInside = style.breakInside === "always";\n        breakAfter = style.breakAfter === "always";\n      }\n      if (breakBefore) {\n        this.newPage();\n      }\n      if (node.hasChildNodes() && !breakInside) {\n        // increse current dom depth\n        // Add node shallow again\n        let newParent = node.cloneNode(false);\n        this.targetParent.appendChild(newParent);\n        this.targetParent = newParent;\n        // this.parentList.push(node);\n        this.domLevelHandler.addToDomLevel(node);\n        this.processContent(node);\n\n        // remove current dom depth\n        this.domLevelHandler.popLevel();\n        // this.parentList.pop();\n        this.targetParent = this.targetParent.parentNode;\n\n        // In case there is none, There has been a page-break and the children are on the new page.\n        // -> No need to render the (empty) wrapping parent in this case then..\n        if (!newParent.hasChildNodes()) {\n          newParent.remove();\n        }\n      } else {\n        let height = this.insertAndCheckNode(node);\n        if (height > this.currentPage.contentHeight) {\n          // Remove overflowing node\n          this.removeLastChildNode();\n\n          // There\'s no further way to break down the children, we create a Break page\n          this.newPage();\n\n          // Re-insert this node\n          let height = this.insertAndCheckNode(node);\n\n          // Still overflowing? Element can\'t be broken even more... MAYDAY :)\n          if (height > this.currentPage.contentHeight) {\n            console.log("Element cannot be rendered to page, does overflow by itself..." + node.textContent);\n          }\n        }\n      }\n      if (breakAfter) {\n        this.newPage();\n      }\n    }\n  }\n  insertAndCheckNode(node) {\n    this.targetParent.appendChild(node.cloneNode(true));\n    return this.currentPage.content.scrollHeight;\n  }\n  newPage() {\n    const page = this.layoutManager.insertPage();\n    this.pages.push(page);\n    this.currentPage = page;\n\n    // Create current domtree\n    this.targetParent = this.currentPage.content;\n    this.targetParent = this.domLevelHandler.renderLevels(page);\n\n    // this.parentList.forEach((node) => {\n    //   let newNode = node.cloneNode(false);\n    //   this.targetParent.appendChild(newNode);\n    //   this.targetParent = newNode;\n    // });\n  }\n  removeLastChildNode() {\n    if (this.targetParent.lastChild) {\n      // Removes the last child, including text nodes\n      this.targetParent.removeChild(this.targetParent.lastChild);\n    }\n  }\n}\n\n//# sourceURL=webpack://Paginate/./src/objects/renderer.js?'
          );

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
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Skeleton: () => (/* binding */ Skeleton)\n/* harmony export */ });\n/**\r\n * PaginateWrapper is responsible for general tasks such as:\r\n * - Generate base wrapper for paginate.js pages\r\n * - Insert base css required for paginate.js\r\n * - Add media print settings for paginate.js\r\n */\nclass Skeleton {\n  constructor(renderTo) {\n    this.renderTo = renderTo;\n  }\n  insertPageWrapper() {\n    const wrapper = document.createElement("div");\n    wrapper.classList.add("paginatejs", "paginatejs-pages");\n    return wrapper;\n  }\n  calculatePageSize() {}\n\n  /** Possible approach:\r\n   * - AddPageWrapper will calculate page dimensions\r\n   * - And insert media rules too at the end of the header\r\n   * - New pages will be required to add throughout skeleton class\r\n   *\r\n   * Approach two:\r\n   * - Renderer is tightly bound to skeleton and will calculate e.g. all throughout skeleton\r\n   *\r\n   * Add layoutAnalyzer or StyleResolver, which will analyze the layout\r\n   */\n\n  static getBaseStyleElement() {\n    const style = document.createElement("style");\n    style.innerHTML = `\n          *, ::after, ::before {\n            box-sizing: border-box;\n          }\n          .paginatejs-pages {\n            display: flex;\n            flex-direction: column;\n            gap: 0.5cm;\n          }\n          .page {\n            width: 210mm;\n            height: 297mm;\n          }\n          .page .header,\n          .page .footer {\n            width: 100%;\n            height: 2cm;\n          }\n          .page .content {\n            width: 100%;\n            height: 100%;\n          }\n          @media print {\n            .paginatejs * {\n              break-after: unset !important;\n              break-before: unset !important;\n              break-inline: unset !important;\n            }\n            .paginatejs{\n              gap: 0px;\n            }\n          }\n        `;\n    return style;\n  }\n\n  /**\r\n   *\r\n   * @param {string} pageWidth - Page width\r\n   * @param {string} pageHeight - Page height\r\n   * @param {HTMLElement} pageWrapper - Paginate.jd page wrapper Element\r\n   *\r\n   * @returns {HTMLElement} mediaStyles\r\n   */\n  static getPrintMediaStyles(pageWidth, pageHeight, pageWrapper) {}\n  static getPagesWrapper() {\n    const wrapper = document.createElement("div");\n    wrapper.classList.add("paginatejs", "paginatejs-pages");\n    return wrapper;\n  }\n}\n\n//# sourceURL=webpack://Paginate/./src/objects/skeleton.js?'
          );

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
          eval(
            '__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   waitForResourcesReady: () => (/* binding */ waitForResourcesReady)\n/* harmony export */ });\n/**\r\n * Waits for all resources (images, etc.) to be fully loaded.\r\n */\nasync function waitForResourcesReady(doc = document) {\n  while (doc.readyState !== "complete") {\n    await new Promise(resolve =>\n    // must be made iframe-save\n    document.defaultView.addEventListener("load", resolve, {\n      once: true\n    }));\n  }\n}\n\n//# sourceURL=webpack://Paginate/./src/utils/waitForRessources.js?'
          );

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
    /******/
    /******/ // startup
    /******/ // Load entry module and return exports
    /******/ // This entry module can't be inlined because the eval devtool is used.
    /******/ var __webpack_exports__ = __webpack_require__("./src/index.js");
    /******/
    /******/ return __webpack_exports__;
    /******/
  })();
});
