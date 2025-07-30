// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import inlineCode from "rollup-plugin-inline-code";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { readFile } from "fs/promises";

const prefix = "inline:";

const paths = new Set();

const inlin_plugin = {
    name: "rollup-plugin-inline-code-fix",
    resolveId: async function (sourcePath, importer, options) {
        if (sourcePath.includes(prefix)) {
            const sourceArray = sourcePath.split(prefix);
            const name = await this.resolve(
                sourceArray[sourceArray.length - 1],
                importer,
                options
            );
            // target - name
            // const moduleInfo = await this.load(name);
            // moduleInfo.moduleSideEffects = true;

            return { id: `${prefix}${name.id}`, moduleSideEffects: true };
        }
        return null;
    },
    load: async function (id) {
        if (id.startsWith(prefix)) {
            const sourceArray = id.split(prefix);
            const filePath = sourceArray[sourceArray.length - 1];
            const code = await readFile(filePath, "utf-8");
            return `export default ${JSON.stringify(code)};`;
        }
        return null;
    },
};

export default [
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
        plugins: [typescript(), nodeResolve(), inlin_plugin],
    },
    {
        input: "codemirror_extension/codemirror_extensions.ts",
        output: {
            format: "es",
            file: "dist/index.d.ts",
        },
        plugins: [dts(), nodeResolve()],
    },
];
