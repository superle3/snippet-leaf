/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    printWidth: 80,
    overrides: [
        {
            files: [
                "browser_extension/**/*.ts",
                "codemirror_extension/**/*.ts",
                "src/**/*.ts",
                "esbuild.config.mjs",
                "rollup.config.mjs",
                "eslint.config.mjs",
                "prettier.config.js",
                "package.json",
                "tsconfig.json",
                "README.md",
                "DOCS.md",
            ],
        },
        {
            files: ["**/*conceal_maps.ts"],
            options: {
                quoteProps: "preserve",
            },
        },
    ],
};

export default config;
