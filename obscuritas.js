try {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('script.js');
    script.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
} catch (e) {
    console.log(e);
}
