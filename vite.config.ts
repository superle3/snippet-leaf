import { defineConfig, type PluginOption } from "vite";
import json5 from "json5";

export const json5Plugin = (): PluginOption => ({
    name: "rollup-plugin-json5",
    transform: {
        filter: {
            id: /\?json5$/,
        },
        handler: function (code, id) {
            if (!id.endsWith("?json5")) {
                return null;
            }
            const parsed = json5.parse(code);
            const new_code = `export default ${JSON.stringify(parsed)};`;
            return {
                code: new_code,
                map: null,
            };
        },
    },
});

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    input: "tests/browser/index.html",
    root: "tests/browser",

    plugins: [json5Plugin()],
});
