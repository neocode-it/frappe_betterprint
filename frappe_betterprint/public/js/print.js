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

}

new BetterPrint();