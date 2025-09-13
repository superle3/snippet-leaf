/// <reference types="node" />
const config = {
    /** @type {import('web-ext-option-types').BuildOptions} */
    build: {
        overwriteDest: true,
    },
    artifactsDir: "artifacts",
    /** @type {import('web-ext-option-types').SignOptions} */
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
    sign: {
        channel: "unlisted",
    },
};

export default config;
