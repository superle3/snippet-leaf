// manually download chrome
import { remote } from "webdriverio";

async function main() {
    await remote({
        capabilities: {
            "goog:chromeOptions": {
                args: [],
            },
            browserName: "chrome",
        },
    });
}

main();
