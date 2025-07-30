// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import inlineCode from "rollup-plugin-inline-code";
import { nodeResolve } from "@rollup/plugin-node-resolve";

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
            paths.add(name.id);

            return name.id;
        }
        return null;
    },
    transform: function (codeContent, id) {
        if (!paths.has(id)) {
            return null;
        }

        const code = `export default ${JSON.stringify(codeContent.trim())};`;
        const map = { mappings: "" };

        return {
            code,
            map,
        };
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
