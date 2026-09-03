// manually download chrome
import { remote } from "webdriverio";
const cacheDir = process.env.VITEST_CACHE_DIR || `${process.env.HOME}/.cache`;

async function main() {
    await remote({
        capabilities: {
            "goog:chromeOptions": {
                args: [],
            },
            browserName: "chrome",
        },
        cacheDir,
    });
}

main();
