/// <reference types="node" />

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

execSync("npm run lint");
execSync("npm run build:greasemonkey");
execSync("npm run web:build");
execSync("npm test");

const semanticBump = process.env.npm_package_version;

const files = [
    "package.json",
    "browser_extension/manifest.json",
    "browser_extension/package.json",
    "package-lock.json",
];
const versions: string[] = [];
for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const version = JSON.parse(content).version;
    versions.push(version);
}
const maxVersion = versions.reduce((a, b) => {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        if (aParts[i] > bParts[i]) return a;
        if (aParts[i] < bParts[i]) return b;
    }
    return a;
});

const [major, minor, patch] = maxVersion.split(".").map(Number);
/** @type {string} */
console.log(semanticBump, major, minor, patch);

for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const json = JSON.parse(content);
    json.version = semanticBump;
    writeFileSync(file, JSON.stringify(json, null, 4) + "\n", "utf-8");
    console.log(`Bumped version in ${file} to ${semanticBump}`);
}

execSync("npm run format");
execSync("git add .");
