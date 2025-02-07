class BetterPrint{

    constructor(){
        if (typeof frappe === "undefined"){
            document.addEventListener("DOMContentLoaded", this.renderPrint());
        } else {
            this.isPreview = true;
            this.registerPreviewListener(this.onPreviewStateChange.bind(this));
        }

        // TODO: Prevent/delay print trigger (frappe script) until rendering is done for print-view
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

        paged.preview( this.printContentElement.content, null, this.printFormat, this.previewDocument).then(this.adjustPreviewDimensions.bind(this));
    }

}

new BetterPrint();