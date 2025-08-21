// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { readFile } from "fs/promises";

const prefix = "inline:";

const inlin_plugin = {
    name: "rollup-plugin-inline-code-fix",
    resolveId: async function (sourcePath, importer, options) {
        if (sourcePath.includes(prefix)) {
            const sourceArray = sourcePath.split(prefix);
            const filePath = sourceArray[sourceArray.length - 1];
            const name = (await this.resolve(filePath, importer, options)) ?? {
                id: filePath,
            };
            return { id: `\0${prefix}${name.id}`, moduleSideEffects: true };
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
};

const browser_config = [
    {
        input: "browser_extension/browser_extension.ts",
        output: {
            format: "iife",
            file: "dist/browser_extension.js",
            sourcemap: true,
        },
        external: ["typescript", "@valtown/codemirror-ts", "path", "fs"],
        plugins: [
            typescript(),
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs(),
            inlin_plugin,
        ],
    },
    {
        input: "browser_extension/settings/settings_tab.ts",
        output: {
            format: "iife",
            name: "dist/settings_tab.js",
            file: "dist/settings_tab.js",
            sourcemap: true,
        },
        external: ["typescript", "@valtown/codemirror-ts", "path", "fs"],
        plugins: [
            typescript(),
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs(),
            inlin_plugin,
        ],
    },
    {
        input: "browser_extension/settings/content_script.ts",
        output: {
            format: "iife",
            file: "dist/content_script.js",
            name: "dist/content_script.js",
            sourcemap: true,
        },
        external: ["typescript", "@valtown/codemirror-ts", "path", "fs"],
        plugins: [
            typescript(),
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs(),
            inlin_plugin,
        ],
    },
];

const codemirror_config = [
    {
        input: "codemirror_extension/codemirror_extensions.ts",
        output: {
            format: "es",
            file: "dist/index.js",
            sourcemap: true,
        },
        external: [
            "@codemirror/autocomplete",
            "@codemirror/commands",
            "@codemirror/language",
            "@codemirror/lint",
            "@codemirror/state",
            "@codemirror/view",
            "@lezer/common",
            "@lezer/highlight",
            "@lezer/lr",
            "tslib",
        ],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
            }),
            nodeResolve({
                tsconfig: "./tsconfig.json",
                browser: true,
                preferBuiltins: false,
            }),
            commonjs(),
            inlin_plugin,
        ],
    },
    {
        input: "codemirror_extension/codemirror_extensions.ts",
        output: {
            format: "es",
            file: "dist/index.d.ts",
        },
        plugins: [
            dts({
                tsconfig: "./tsconfig.json",
            }),
        ],
    },
];

export default [...browser_config];
