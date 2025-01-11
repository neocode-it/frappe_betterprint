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

    content = document.querySelector(".print-preview iframe")?.contentDocument;
    
    if(content === null){
        return;
    }

    script = content.querySelector(".print-format-preview")?.firstElementChild;

    if(script === null){
        return;
    }

    if (script.classList.contains("betterprint-script")) { 
        script.classList.remove("betterprint-script");
        // Run Script
        // new Function(script.innerHTML)();
        console.log("Betterprint content loaded :)");
    }
});

// Use this in order to prevent-double-loading?
betterPdfLink = "";
