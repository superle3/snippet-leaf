// This file bundles only the settings utilities needed for the userscript
// Tree shaking will remove unused exports from src/settings/settings.ts

import { DEFAULT_SETTINGS } from "src/settings/default_settings";
document.addEventListener("snippet_leaf_config_listen", (e) => {
    document.dispatchEvent(
        new CustomEvent("snippet_leaf_config_send", {
            detail: DEFAULT_SETTINGS,
        }),
    );
});
document.dispatchEvent(
    new CustomEvent("snippet_leaf_config_send", {
        detail: DEFAULT_SETTINGS,
    }),
);
