function listenForAjaxStateChange(callback) {
    const targetNode = document.body;

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-ajax-state') {
                callback(targetNode.getAttribute('data-ajax-state'));
            }
        }
    });

    observer.observe(targetNode, { attributes: true });

    // Initial call to the callback in case the attribute is already set
    const initialState = targetNode.getAttribute('data-ajax-state');
    if (initialState !== null) {
        callback(initialState);
    }
}

listenForAjaxStateChange((newState) => {
    if (newState !== "complete"){
        return;
    }

    iframe = document.querySelector(".print-preview iframe")?.contentDocument;
    
    // Check if this format is a betterprint format
    if(!iframe){
        return;
    }
    
    if(!iframe.querySelector(".betterprint-script")){
        restoreDefaultPreview();

        return;
    }

    // Test if it has been processed
    if(!iframe.querySelector(".betterprint-script.active")){
        return;
    }

    // Remove styles applied earlier to preview
    restoreDefaultPreview();
    dom = preParePageContents(iframe);
    
    if(!dom){
        return;
    }

    if (dom.classList.contains("betterprint-script")) {
        console.log("Found betterprint");
        target = iframe.querySelector(".print-format-preview");

        // Initialize the Previewer using the global Paged object
        let paged = new Paged.Previewer(); // PagedModule

        // Use paged.preview with the selected DOM iframe
        paged.preview(dom.content, null, target).then((flow) => {
            console.log("Rendered", flow.total, "pages.");
function restoreDefaultPreview(){
    // Remove size presets
    printPreview = document.querySelector(".print-preview");
    printPreview.removeAttribute("style");

    // Remove scale for oversized formats
    const contentFrame = document.querySelector(".print-preview iframe");
    contentFrame.contentDocument.body.removeAttribute("style");

    // Height settings for iframe don't need to be removed
    // frappe's print script will adjust it by itself
}

function preParePageContents(iframe) {
    const printFormat = iframe.querySelector(".print-format");

    printFormat.style.padding = "0";
    printFormat.style.margin = "0";
    printFormat.style.width = "fit-content";

    document.querySelector(".print-preview").style.minHeight = "unset";

    return printFormat.firstChild;
}