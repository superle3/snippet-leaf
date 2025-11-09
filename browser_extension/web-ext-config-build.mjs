/// <reference types="node" />
const config = {
    /** @type {import('web-ext-option-types').BuildOptions} */
    build: {
        overwriteDest: true,
    },
    artifactsDir: "artifacts",
    ignoreFiles: [
        "node_modules/**",
        "settings/**",
        "web-ext-artifacts/**",
        ".amo-upload-uuid",
        "*.ts",
        "*.mjs",
        "package.json",
        "package-lock.json",
    ],
    /** @type {import('web-ext-option-types').SignOptions} */
    sign: {
        channel: "unlisted",
    },
};

export default config;
