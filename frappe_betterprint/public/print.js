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

// Usage example:
listenForAjaxStateChange((newState) => {
    if (newState !== "complete"){
        return;
    }

    iframe = document.querySelector(".print-preview iframe")?.contentDocument;
    
    if(!iframe){
        return;
    }

    dom = iframe.querySelector(".betterprint-script");

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
        });


        // dom.classList.remove("betterprint-script");


        // Run Script
        // new Function(script.innerHTML)();
        console.log("Betterprint content loaded :)");

        ifr = document.querySelector(".print-preview iframe");

        ifr.style.height = ifr.contentWindow.document.documentElement.scrollHeight + 'px';    
    }
});

// Use this in order to prevent-double-loading?
betterPdfLink = "";
