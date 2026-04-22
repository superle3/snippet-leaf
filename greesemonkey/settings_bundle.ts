// This file bundles only the settings utilities needed for the userscript
// Tree shaking will remove unused exports from src/settings/settings.ts

import { DEFAULT_SETTINGS } from "src/settings/default_settings";
window.addEventListener("snippet_leaf_config_listen", (e) => {
    window.dispatchEvent(
        new CustomEvent("snippet_leaf_config_send", {
            detail: DEFAULT_SETTINGS,
        }),
    );
});
window.dispatchEvent(
    new CustomEvent("snippet_leaf_config_send", {
        detail: DEFAULT_SETTINGS,
    }),
);
