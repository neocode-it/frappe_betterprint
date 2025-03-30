class BetterPrint {
  constructor() {
    // Print view page
    if (typeof frappe === "undefined") {
      document.addEventListener("DOMContentLoaded", this.renderPrint());
    }
    // Print preview page
    else {
      this.isPreview = true;
      this.registerPreviewListener(this.onPreviewStateChange.bind(this));
    }
  }

  registerPreviewListener(callback) {
    const targetNode = document.body;

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-ajax-state"
        ) {
          callback(targetNode.getAttribute("data-ajax-state"));
        }
      }
    });

    observer.observe(targetNode, { attributes: true });

    // Check for the initial state
    const initialState = targetNode.getAttribute("data-ajax-state");
    if (initialState !== null) {
      callback(initialState);
    }
  }

  onPreviewStateChange(newState) {
    if (newState !== "complete") {
      return;
    }

    this.iframe = document.querySelector(".print-preview iframe");
    this.previewDocument = this.iframe?.contentDocument ?? null;
    this.printPreview = document.querySelector(".print-preview");
    this.printFormat =
      this.previewDocument?.querySelector(".print-format") ?? null;

    if (
      !this.iframe ||
      !this.previewDocument ||
      !this.printPreview ||
      !this.printFormat
    ) {
      return;
    }

    this.printContentElement = this.previewDocument.querySelector(
      ".betterprint-content"
    );

    if (!this.printContentElement) {
      // Page doesn't contain betterprint, remove default styles
      this.resetPreviewStyles();
      return;
    } else if (this.printContentElement.classList.contains("rendered")) {
      // Preview has already been rendered... nothing to do here.
      return;
    } else {
      this.printContentElement.classList.add("rendered");
    }
    this.renderPreview();
  }

  renderPreview() {
    // Reset possible previous styles
    this.resetPreviewStyles(true);

    // Prepare new styles
    this.preparePreviewStyles();

    // Initialize the Previewer using the global Paged object
    let paginate = new Paginate.Renderer(
      this.printContentElement,
      this.printFormat
    );
    paginate.render();

    this.afterPreviewRendering();
  }

  afterPreviewRendering() {
    console.log("Rendered all pages.");

    const contentWidth = this.printFormat.scrollWidth;
    let scale = 1;

    // Adjust height of parent to content
    this.printPreview.style.width = contentWidth + "px";
    // Check actual rendered width
    const actualParentWidth = this.printPreview.offsetWidth;

    // Content larger than maxWidth of parent? scale content down
    if (actualParentWidth < contentWidth) {
      scale = actualParentWidth / contentWidth;
      this.iframe.contentDocument.body.style.transform = `scale(${scale})`;
      // This ensures the content scales from the top-left corner
      this.iframe.contentDocument.body.style.transformOrigin = "0 0";
    }

    // Adjust height
    // Needs to have a delay, since frappe's print.js will adjust the height by itself, which might reset height in this case.
    setTimeout(() => {
      this.iframe.style.height =
        Math.round(this.printFormat.scrollHeight * scale) + "px";

      this.emitFinishEvent();
    }, 500);
  }

  resetPreviewStyles(keepDimensions = false) {
    const height = this.iframe.offsetHeight + "px";
    const width = this.printPreview.offsetWidth + "px";

    this.printPreview.removeAttribute("style");
    this.printFormat.removeAttribute("style");
    this.iframe.removeAttribute("style");
    this.previewDocument.body.removeAttribute("style");

    if (keepDimensions) {
      this.printPreview.style.width = width;
      this.iframe.style.height = height;
    }
  }

  preparePreviewStyles() {
    // Modify print-format styles in order to prevent issues between paginatejs and default frappe rendering
    // hard-code those styles in order to ensure maximum priority
    this.printFormat.style.padding = "0";
    this.printFormat.style.margin = "0";
    this.printPreview.style.minHeight = "unset";

    // Insert styles with less priority
    const style = document.createElement("style");
    style.innerHTML = `
    body{
      width: fit-content;
    }
    .print-format{
      max-width: unset !important
    }
    .paginatejs-pages{
      background-color: #ededed;
    }
    .page{
      background-color: white;
    }
    `;
    const head = this.previewDocument.head;
    head.insertBefore(style, head.firstChild);
  }

  renderPrint() {
    this.printFormat = document.querySelector(".print-format");

    this.preparePrintStyles();

    const dom = this.printFormat.querySelector(".betterprint-content");

    if (!dom) return;

    // Initialize the Previewer using the global Paged object
    let paginate = new Paginate.Renderer(dom, this.printFormat);
    paginate.render();

    this.afterPrintRendering();
  }

  preparePrintStyles() {
    this.printFormat.style.minHeight = "unset";
    this.printFormat.style.margin = "0";
    this.printFormat.style.padding = "0";

    document.querySelector(".print-format-gutter").style.minHeight = "90vh";
  }

  afterPrintRendering(flow) {
    console.log("Rendered", flow.total, "pages.");

    document.querySelector(".action-banner").classList.remove("print-hide");

    document.addEventListener("DOMContentLoaded", function () {
      console.log("again");
    });

    let style = document.createElement("style");
    style.textContent = `
            .print-format-gutter{
            justify-content: center;
            display: flex;
            padding: 30px;
            background-color: #d1d8dd;
            height: fit-content;
            }
            .action-banner a{
            text-decoration: unset;
            }
            .action-banner a:hover{
            text-decoration: underline;
            }
            .print-format{
            width: fit-content;
            /* scale can be applied here */
            transform-origin: top center;
            }

            @media print{
            .action-banner{
                display: none;
            }
            .print-format-gutter{
            padding: unset;
            display: unset;
            }
            .print-format{
            transform: unset;}
            }
        `;

    document.head.appendChild(style);

    this.emitFinishEvent();

    this.checkAndTriggerPrint();
  }

  checkAndTriggerPrint() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check if the 'trigger_print' parameter is set to '1'
    if (urlParams.get("trigger_print") === "1") {
      window.print();
      // close the window after print
      // NOTE: doesn't close if print is cancelled in Chrome
      // Changed timeout to 5s from 1s because it blocked mobile view rendering
      setTimeout(function () {
        window.close();
      }, 5000);
    }
  }

  emitFinishEvent() {
    document.dispatchEvent(
      new CustomEvent("betterPrintFinished", {
        detail: {
          message: "Betterprint has finished rendering page!",
        },
      })
    );
  }
}

new BetterPrint();
