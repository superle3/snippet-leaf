import { readFile } from "fs/promises";
import { defineConfig, type PluginOption } from "vite";
import json5 from "json5";
const prefix = "inline:";

export const textPlugin = (): PluginOption => ({
    name: "rollup-plugin-inline-code-fix",
    resolveId: async function (sourcePath, importer, options) {
        if (sourcePath.includes(prefix)) {
            const sourceArray = sourcePath.split(prefix);
            const filePath = sourceArray[sourceArray.length - 1];
            const name = (await this.resolve(filePath, importer, options)) ?? {
                id: filePath,
            };
            return {
                id: `\0${prefix}${name.id}`,
                moduleSideEffects: true,
            };
        }
        return null;
    },
    load: async function (id) {
        if (id.startsWith(`\0${prefix}`)) {
            const sourceArray = id.split(prefix);
            const filePath = sourceArray[sourceArray.length - 1];
            const code = await readFile(filePath, "utf-8");
            return `export default ${JSON.stringify(code)};`;
        }
        return null;
    },
});

export const json5Plugin = (): PluginOption => ({
    name: "rollup-plugin-json5",
    transform: {
        filter: {
            id: /^\/.*\.json5$/,
        },
        handler: function (code, id) {
            if (!id.endsWith(".json5")) {
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

    plugins: [textPlugin(), json5Plugin()],
});
