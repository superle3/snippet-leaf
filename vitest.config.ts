import { defineConfig } from "vitest/config";
import { webdriverio } from "@vitest/browser-webdriverio";
import { textPlugin, json5Plugin } from "./vite.config.ts";

const cacheDir = process.env.VITEST_CACHE_DIR || `${process.env.HOME}/.cache`;

export default defineConfig({
    plugins: [textPlugin(), json5Plugin()],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        root: "tests/browser",
        setupFiles: ["index.ts"],
        browser: {
            enabled: true,
            testerHtmlPath: "test.html",
            provider: webdriverio({
                // ...custom webdriverio options
                cacheDir,
            }),
            instances: [
                {
                    browser: "chrome",
                },
            ],
        },
    },
});
