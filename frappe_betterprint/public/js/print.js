class BetterPrint{

    constructor(){
        if (typeof frappe === "undefined"){
            document.addEventListener("DOMContentLoaded", this.renderPrint());
        } else {
            this.isPreview = true;
            this.registerPreviewListener(this.onPreviewStateChange.bind(this));
        }
    }

    registerPreviewListener(callback) {
        const targetNode = document.body;
    
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-ajax-state') {
                    callback(targetNode.getAttribute('data-ajax-state'));
                }
            }
        });
    
        observer.observe(targetNode, { attributes: true });
    
        // Check for the initial state
        const initialState = targetNode.getAttribute('data-ajax-state');
        if (initialState !== null) {
            callback(initialState);
        }
    }
    
    onPreviewStateChange(newState){
        if (newState !== "complete"){
            return;
        }

        this.iframe = document.querySelector(".print-preview iframe");
        this.previewDocument = this.iframe?.contentDocument ?? null;
        this.printPreview = document.querySelector(".print-preview");
        this.printFormat = this.previewDocument?.querySelector(".print-format") ?? null;
        
        if(!this.iframe || !this.previewDocument || !this.printPreview || !this.printFormat){
            return;
        }

        this.printContentElement = this.previewDocument.querySelector(".betterprint-content");

        if(!this.printContentElement){
            // Page doesn't contain betterprint, remove default styles
            this.resetPreviewStyles();
            return;
        } else if(this.printContentElement.classList.contains("rendered")){
            // Preview has already been rendered... nothing to do here.
            return;
        } else {
            this.printContentElement.classList.add("rendered");
        }
        this.renderPreview();
    }

    renderPreview(){
        // Reset possible previous styles
        this.resetPreviewStyles(true);

        // Prepare new styles
        this.preparePreviewStyles();

        // Initialize the Previewer using the global Paged object
        let paged = new Paged.Previewer(); // PagedModule

        paged.preview( this.printContentElement.content, null, this.printFormat, this.previewDocument).then(this.afterPreviewRendering.bind(this));
    }

    afterPreviewRendering(flow){
        console.log("Rendered", flow.total, "pages.");
        
        const contentWidth = this.printFormat.scrollWidth;
        let scale = 1;

        // Adjust height of parent to content
        this.printPreview.style.width = contentWidth + "px";
        // Check actual rendered width
        const actualParentWidth = this.printPreview.offsetWidth;

        

        // Content larger than maxWidth of parent? scale content down
        if(actualParentWidth < contentWidth){
            scale = actualParentWidth / contentWidth;
            this.iframe.contentDocument.body.style.transform = `scale(${scale})`;
            // This ensures the content scales from the top-left corner
            this.iframe.contentDocument.body.style.transformOrigin = "0 0";
        }

        // Adjust height
        // Needs to have a delay, since frappe's print.js will adjust the height by itself, which might reset height in this case.
        setTimeout(() => {
            this.iframe.style.height = Math.round(this.printFormat.scrollHeight * scale) + "px";

            this.emitFinishEvent();
        }, 500);
    }

    resetPreviewStyles(keepDimensions = false){    
        const height = this.iframe.offsetHeight + "px";
        const width = this.printPreview.offsetWidth + "px";

        this.printPreview.removeAttribute("style");
        this.printFormat.removeAttribute("style");
        this.iframe.removeAttribute("style");
        this.previewDocument.body.removeAttribute("style");

        if(keepDimensions){
            this.printPreview.style.width = width;
            this.iframe.style.height = height;
        }
    }

    preparePreviewStyles(){
        // Modify print-format styles in order to prevent issues between pagedjs and default frappe rendering
        this.printFormat.style.padding = "0";
        this.printFormat.style.margin = "0";
        this.printFormat.style.width = "fit-content";
        this.printPreview.style.minHeight = "unset";
    }

    async renderPrint(){
        this.printFormat = document.querySelector(".print-format");

        this.preparePrintStyles();

        const dom = this.printFormat.querySelector(".betterprint-content");

        if(!dom) return;

        let paged = new Paged.Previewer();
        
        
        paged.preview( dom.content, null, this.printFormat ).then(this.afterPrintRendering.bind(this));
    }

    preparePrintStyles(){
        this.printFormat.style.minHeight = "unset";
        this.printFormat.style.margin = "0";
        this.printFormat.style.padding = "0";

        document.querySelector(".print-format-gutter").style.minHeight = "90vh";
    }


    emitFinishEvent(){
        document.dispatchEvent(new CustomEvent("betterPrintFinished", {
            detail: { 
                message: "Betterprint has finished rendering page!"
            }
        }));
    }

}

new BetterPrint();