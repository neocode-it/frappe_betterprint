/*! @license Paginatejs v1.0.0 | MIT License | (C) 2025 Neocode */
!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define([], t)
    : "object" == typeof exports
    ? (exports.Paginate = t())
    : (e.Paginate = t());
})(self, () =>
  (() => {
    "use strict";
    var e = {
        d: (t, n) => {
          for (var s in n)
            e.o(n, s) &&
              !e.o(t, s) &&
              Object.defineProperty(t, s, { enumerable: !0, get: n[s] });
        },
        o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
        r: (e) => {
          "undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(e, "__esModule", { value: !0 });
        },
      },
      t = {};
    e.r(t), e.d(t, { Renderer: () => i });
    class n {
      constructor(e) {
        (this.reservedKeys = ["pageNumber", "totalPages"]), (this.pages = e);
      }
      decorate() {
        const e = this.#e(this.pages);
        this.#t(e), this.#n(e);
      }
      #t(e) {
        this.pages.forEach((t, n) => {
          this.#s(t, e[n - 1], e[n], n + 1);
        });
      }
      #s(e, t, n, s) {
        if (1 == s) {
          const t = e.content.querySelectorAll(
            'paginate-source[data-key="header"]'
          )[0];
          t && (e.header.innerHTML = t.innerHTML);
        } else {
          const n = t[this.hash("header")];
          n && (e.header.innerHTML = n.innerHTML);
        }
        const a = 1 == s ? n : t;
        let r = e.header.querySelectorAll(
          'paginate-target:not([data-status="solved"])'
        );
        for (; r.length; )
          r.forEach((e) => {
            const t = e.getAttribute("data-key") ?? "empty-key";
            "pageNumber" === t || "totalPages" === t
              ? (e.innerHTML = n[this.hash(t)]?.innerHTML ?? "")
              : "header" !== t &&
                (e.innerHTML = a[this.hash(t)]?.innerHTML ?? ""),
              e.setAttribute("data-status", "solved");
          }),
            (r = e.header.querySelectorAll(
              'paginate-target:not([data-status="solved"])'
            ));
      }
      #n(e) {
        this.pages.forEach((t, n) => {
          this.#a(t, e[n]);
        });
      }
      #a(e, t) {
        const n = t[this.hash("footer")];
        n && (e.footer.innerHTML = n.innerHTML);
        let s = e.footer.querySelectorAll(
          'paginate-target:not([data-status="solved"])'
        );
        for (; s.length; )
          s.forEach((e) => {
            const n = e.getAttribute("data-key") ?? "empty-key";
            "footer" !== n && (e.innerHTML = t[this.hash(n)]?.innerHTML ?? ""),
              e.setAttribute("data-status", "solved");
          }),
            (s = e.footer.querySelectorAll(
              'paginate-target:not([data-status="solved"])'
            ));
      }
      #e(e) {
        let t = [],
          n = {};
        for (let s = 0; s < e.length; s++) {
          let a = this.parseCurrentPage(e[s]);
          (a = Object.assign({}, n, this.parseCurrentPage(e[s]))),
            t.push(a),
            (n = a);
        }
        return this.insertPageNumberReference(t), t;
      }
      parseCurrentPage(e) {
        const t = e.content.querySelectorAll("paginate-source");
        let n = {};
        return (
          t.forEach((e) => {
            const t = e.getAttribute("data-key");
            if (t && "" !== t.trim() && !this.reservedKeys.includes(t)) {
              const s = this.hash(t);
              n[s] = e;
            }
          }),
          n
        );
      }
      insertPageNumberReference(e) {
        const t = document.createElement("span");
        t.innerHTML = e.length;
        const n = this.hash("pageNumber"),
          s = this.hash("totalPages");
        for (let a = 0; a < e.length; a++) {
          const r = document.createElement("span");
          (r.innerHTML = a + 1), (e[a][n] = r), (e[a][s] = t);
        }
      }
      hash(e) {
        let t = 0;
        for (let n = 0, s = e.length; n < s; n++) {
          (t = (t << 5) - t + e.charCodeAt(n)), (t |= 0);
        }
        return t;
      }
    }
    class s {
      constructor(e, t, n, s = []) {
        (this.parent = e),
          (this.pageRange = s),
          (this.width = t),
          (this.height = n),
          (this.page = this.createPage());
      }
      createPage() {
        0 == this.pageRange.length && this.pageRange.push("default");
        const e = document.createElement("div");
        e.classList.add("page", ...this.pageRange),
          (e.style.margin = "0"),
          (e.style.display = "flex"),
          (e.style.flexDirection = "column"),
          (e.style.overflow = "hidden");
        const t = document.createElement("div");
        t.classList.add("header"),
          (t.style.margin = "0"),
          (t.style.width = "100%");
        const n = document.createElement("div");
        n.classList.add("content"),
          (n.style.margin = "0"),
          (n.style.width = "100%"),
          (n.style.height = "unset"),
          (n.style.flexGrow = "1");
        const s = document.createElement("div");
        s.classList.add("footer"),
          (s.style.margin = "0"),
          (s.style.width = "100%"),
          e.append(t, n, s),
          this.parent.appendChild(e),
          this.calculateAndLockHeights(e, t, n, s),
          (this.page = e),
          (this.header = t),
          (this.content = n),
          (this.footer = s);
      }
      calculateAndLockHeights(e, t, n, s) {
        (e.style.width = this.width + "px"),
          (e.style.maxWidth = this.width + "px"),
          (e.style.height = this.height + "px"),
          (e.style.maxHeight = this.height + "px");
        const a = t.offsetHeight;
        (t.style.height = a + "px"), (t.style.maxHeight = a + "px");
        const r = s.offsetHeight;
        (s.style.height = r + "px"), (s.style.maxHeight = r + "px");
        const i = n.offsetHeight;
        (n.style.height = i + "px"),
          (n.style.maxHeight = i + "px"),
          (this.headerHeight = a),
          (this.contentHeight = i),
          (this.footerHeight = r);
      }
    }
    class a {
      constructor(e) {
        this.parentElement = e;
      }
      preparePrintLayout() {
        this.#r(), this.#i(), this.#o(), this.#h(), this.#l();
      }
      finishPrintLayout() {
        this.#d();
      }
      #d() {
        const e = this.wrapper.lastElementChild;
        e &&
          ((e.style.height = e.offsetHeight - 2 + "px"),
          (e.style.maxHeight = e.style.height));
      }
      insertPage(e = []) {
        return new s(this.wrapper, this.pageWidth, this.pageHeight, e);
      }
      #i() {
        const e = this.parentElement.ownerDocument;
        for (let t = e.styleSheets.length - 1; t >= 0; t--) {
          const n = e.styleSheets[t];
          try {
            for (let e = n.cssRules.length - 1; e >= 0; e--)
              n.cssRules[e].media &&
                "print" === n.cssRules[e].media.mediaText &&
                n.deleteRule(e);
          } catch (e) {
            console.warn(`Unable to access rules in stylesheet: ${n.href}`);
          }
        }
        e.querySelectorAll("style").forEach((e) => {
          const t = e.sheet;
          try {
            for (let e = t.cssRules.length - 1; e >= 0; e--)
              t.cssRules[e].media &&
                "print" === t.cssRules[e].media.mediaText &&
                t.deleteRule(e);
          } catch (e) {
            console.warn("Error processing inline style element:", e);
          }
        });
      }
      #r() {
        const e = document.createElement("div");
        e.classList.add("paginatejs", "paginatejs-pages"),
          this.parentElement.appendChild(e),
          (this.wrapper = e);
      }
      #o() {
        const e = document.createElement("style");
        e.innerHTML =
          "\n          *, ::after, ::before {\n            box-sizing: border-box;\n          }\n          paginate-source{\n            display: none;\n          }\n          .paginatejs-pages {\n            display: flex;\n            flex-direction: column;\n            gap: 0.5cm;\n          }\n          .page {\n            width: 210mm;\n            height: 297mm;\n          }\n          .page .header,\n          .page .footer {\n            width: 100%;\n            height: 2cm;\n          }\n          .page .content {\n            width: 100%;\n            height: 100%;\n          }\n          @media print {\n            .paginatejs * {\n              break-after: unset !important;\n              break-before: unset !important;\n              break-inline: unset !important;\n              page-break-after: unset !important;\n              page-break-inside: unset !important;\n              page-break-before: unset !important;\n            }\n            .paginatejs{\n              gap: 0px;\n            }\n            \n            .paginatejs .page{\n              break-after: page;\n            }\n          }\n      ";
        const t = this.parentElement.ownerDocument;
        t.head.insertBefore(e, t.head.firstChild);
      }
      #h() {
        const e = document.createElement("div");
        e.classList.add("page", "default"),
          (e.style.position = "absolute"),
          (e.style.top = "-9999px"),
          (e.style.left = "-9999px"),
          this.wrapper.appendChild(e);
        const t = e.offsetHeight,
          n = e.offsetWidth;
        e.remove(), (this.pageHeight = t), (this.pageWidth = n);
      }
      #l() {
        const e = "size: " + this.pageWidth + "px " + this.pageHeight + "px;",
          t = document.createElement("style");
        t.innerHTML = "@page{ " + e + " margin: 0}";
        this.parentElement.ownerDocument.head.appendChild(t);
      }
    }
    class r {
      constructor() {
        (this.domLevels = []), (this.target = null);
      }
      addToDomLevel(e) {
        let t = [],
          n = [];
        "TBODY" === e.tagName && this.#c(t, e, n);
        const s = { before: t, main: e, after: n };
        this.domLevels.push(s);
      }
      #c(e, t, n) {
        let s = t.previousElementSibling;
        t.nextElementSibling;
        for (; s; ) {
          if ("THEAD" === s.tagName) {
            if (
              "table-header-group" ===
              s.ownerDocument.defaultView.getComputedStyle(s).display
            ) {
              e.push(s);
              break;
            }
          }
          s = s.previousElementSibling;
        }
      }
      popLevel() {
        this.domLevels.pop();
      }
      renderLevels(e) {
        let t = e.content;
        return (
          this.domLevels.forEach((e) => {
            e.before.forEach((e) => {
              t.appendChild(e.cloneNode(!0));
            });
            const n = e.main.cloneNode(!1);
            t.appendChild(n),
              e.after.forEach((e) => {
                t.appendChild(e.cloneNode(!0));
              }),
              (t = n);
          }),
          t
        );
      }
    }
    class i {
      constructor(e, t = document.body) {
        (this.content = e),
          (this.renderTo = t),
          (this.pages = []),
          (this.targetParent = this.page),
          (this.parentList = []),
          (this.domLevelHandler = new r());
      }
      prepareTarget(e) {
        (this.layoutManager = new a(e)),
          this.layoutManager.preparePrintLayout(),
          (this.renderTo = this.layoutManager.wrapper),
          this.newPage();
      }
      render() {
        !(async function (e = document) {
          for (; "complete" !== e.readyState; )
            await new Promise((e) =>
              document.defaultView.addEventListener("load", e, { once: !0 })
            );
        })(this.content.ownerDocument),
          this.prepareTarget(this.renderTo),
          this.processContent(),
          this.layoutManager.finishPrintLayout(),
          new n(this.pages).decorate();
      }
      processContent(e = this.content) {
        for (let t = 0; t < e.childNodes.length; t++) {
          const n = e.childNodes[t];
          let s = !1,
            a = !1,
            r = !1;
          if (n.nodeType === Node.ELEMENT_NODE) {
            const e = n.ownerDocument.defaultView.getComputedStyle(n);
            (a = "page" === e.breakBefore),
              (s = "avoid" === e.breakInside),
              (r = "page" === e.breakAfter);
          }
          if ((a && this.newPage(), n.hasChildNodes() && !s)) {
            let e = n.cloneNode(!1);
            this.targetParent.appendChild(e),
              (this.targetParent = e),
              this.domLevelHandler.addToDomLevel(n),
              this.processContent(n),
              this.domLevelHandler.popLevel(),
              (this.targetParent = this.targetParent.parentNode),
              e.hasChildNodes() || e.remove();
          } else {
            if (this.insertAndCheckNode(n) > this.currentPage.contentHeight) {
              this.removeLastChildNode(),
                this.newPage(),
                this.insertAndCheckNode(n) > this.currentPage.contentHeight &&
                  console.log(
                    "Element cannot be rendered to page, does overflow by itself..." +
                      n.textContent
                  );
            }
          }
          r && this.newPage();
        }
      }
      insertAndCheckNode(e) {
        return (
          this.targetParent.appendChild(e.cloneNode(!0)),
          this.currentPage.content.scrollHeight
        );
      }
      newPage() {
        const e = this.layoutManager.insertPage();
        this.pages.push(e),
          (this.currentPage = e),
          (this.targetParent = this.currentPage.content),
          (this.targetParent = this.domLevelHandler.renderLevels(e));
      }
      removeLastChildNode() {
        this.targetParent.lastChild &&
          this.targetParent.removeChild(this.targetParent.lastChild);
      }
    }
    return t;
  })()
);
