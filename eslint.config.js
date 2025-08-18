import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default tseslint.config(
    {
        ignores: [
            "dist/",
            "node_modules/",
            "browser_extension/dist/",
            "website/",
            "codemirror_extension/dist/",
            "eslint.config.js",
            "browser_extension/settings/snippets/",
        ],
    },

    // Base ESLint recommended rules
    js.configs.recommended,

    // TypeScript recommended rules
    ...tseslint.configs.recommended,

    // Custom configuration for all files
    {
        plugins: {
            import: importPlugin,
        },
        settings: {
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
            "@typescript-eslint/ban-ts-comment": "off",
            "no-prototype-builtins": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/consistent-type-imports": "error",
            quotes: ["warn", "double", { avoidEscape: true }],
        },
    },
);
