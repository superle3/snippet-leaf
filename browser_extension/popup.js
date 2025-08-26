(window.browser ?? window.chrome).tabs.create({ url: "settings.html" });
setTimeout(() => {
    try {
        window.close();
    } catch (e) {
        console.error("Error closing window:", e);
    }
}, 100);
