Any PRs/issues are always welcome.
If you know your PR is going to be large, please open a feature request first stating what the feature is and that you want to implement it.

# Running with a custom Firefox/Chromium profile (for development)

## Installation

This project uses `web-ext` to temporarily run the web extension in the browser.

1. Install all dependencies (including `web-ext`) with:

    ```
    npm install
    ```

## Steps to run with a custom Firefox profile

1. Create a web-ext-config.mjs with the following

```js
export default {
    run: {
        // This can be any profile on your firefox-based browser or left empty
        firefoxProfile: "dev",
        firefoxBinary: "path/to/firefox/binary",
        // This can be any profile on your chromium-based browser or left empty
        chromiumProfile: "dev",
        chromiumBinary: "path/to/chromium/binary",
        // if you self-host or use a self-hosted overleaf, use that url.
        startUrl: ["https://www.overleaf.com/project"],
        keepProfileChanges: true,
        // remove the one you don't want to develop one
        target: ["firefox", "chromium"],
    },
};
```

Here a chromium-based browser refers to browsers like Chrome, Edge, Vivaldi, Opera, etc,
and a firefox-based browser refers to browsers like Firefox, Librewolf, Zen, Waterfox, etc.
If your browser is not in this list and you don't know which it is, then you can check it, by going to `chrome://extensions` (which works for chromium browsers) and `about:addons` (which works for firefox browsers).

I recommend creating a special profile for development instead of using a temporary profile every time,
because otherwise you have to relogin every time you open overleaf.
Do not use your daily/default profile for development and don't use the development profile for daily use as this is insecure.

2. Run the extension in Firefox with your profile:

    ```
    npm run web:full
    ```

# Safari/Webkit

Documentation needed (as I do not own apple hardware). A PR describing development for safari is always welcome and if you're interested in publishing this extension on the app store, please let me know.
