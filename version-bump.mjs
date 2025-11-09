import { readFileSync, writeFileSync } from "fs";
import path from "path";

const semanticBump = process.argv[2];

const files = [
    "package.json",
    "browser_extension/manifest.json",
    "browser_extension/package.json",
    "package-lock.json",
];
const dir = path.dirname(new URL(import.meta.url).pathname);
/** @type {string[]} */
const versions = [];
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
let newVersion;
if (semanticBump === "major") {
    newVersion = `${major + 1}.0.0`;
} else if (semanticBump === "minor") {
    newVersion = `${major}.${minor + 1}.0`;
} else {
    newVersion = `${major}.${minor}.${patch + 1}`;
}

for (const filename of files) {
    const file = path.join(dir, filename);
    const content = readFileSync(file, "utf-8");
    const json = JSON.parse(content);
    json.version = newVersion;
    writeFileSync(file, JSON.stringify(json, null, 4) + "\n", "utf-8");
    console.log(`Bumped version in ${filename} to ${newVersion}`);
}
