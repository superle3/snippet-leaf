// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import inlineCode from "rollup-plugin-inline-code";

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
        plugins: [typescript(), inlineCode.default({ prefix: "inline:" })],
    },
    {
        input: "codemirror_extension/codemirror_extensions.ts",
        output: {
            format: "es",
            file: "dist/index.d.ts",
        },
        plugins: [dts()],
    },
];
