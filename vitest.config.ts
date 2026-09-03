import { defineConfig } from "vitest/config";
import { webdriverio } from "@vitest/browser-webdriverio";
import { inlin_plugin, json5Plugin } from "./esbuild.config.mts";

export default defineConfig({
    plugins: [inlin_plugin(), json5Plugin()],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        setupFiles: ["tests/browser/dist/index.js"],
        browser: {
            enabled: true,
            testerHtmlPath: "tests/browser/index.html",
            provider: webdriverio({
                // ...custom webdriverio options
            }),
            instances: [
                {
                    browser: "chrome",
                },
            ],
        },
    },
});
