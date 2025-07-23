/// <reference types="firefox-webext-browser" />

async function send_config(): Promise<void> {
    const config = await browser.storage.sync.get({ snippet_leaf_config: {} });
    document.dispatchEvent(
        new CustomEvent("snippet_leaf_config_send", {
            detail: {
                config: config.snippet_leaf_config,
            },
        })
    );
}

document.addEventListener("snippet_leaf_config_listen", () => {
    send_config;
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.snippet_leaf_config) {
        send_config();
    }
});
