import { readFileSync, writeFileSync } from "fs";
import path from "path";

const semanticBump = process.env.npm_package_version;

const files = [
    "package.json",
    "browser_extension/manifest.json",
    "browser_extension/package.json",
    "package-lock.json",
];
const dir = path.dirname(new URL(import.meta.url).pathname);
const versions: string[] = [];
for (const filename of files) {
    const file = path.join(dir, filename);
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

for (const filename of files) {
    const file = path.join(dir, filename);
    const content = readFileSync(file, "utf-8");
    const json = JSON.parse(content);
    json.version = semanticBump;
    writeFileSync(file, JSON.stringify(json, null, 4) + "\n", "utf-8");
    console.log(`Bumped version in ${filename} to ${semanticBump}`);
}
