# Running with a custom Firefox profile (for development)

## Installation

This project uses `web-ext` and `dotenv-cli` for local development. Both are installed as dev dependencies.

1. Install all dependencies (including `web-ext` and `dotenv-cli`) with:

    ```
    npm install
    ```

2. (Optional) If you want to install them globally instead, run:

    ```
    npm install --global web-ext dotenv-cli
    ```

## Steps to run with a custom Firefox profile

1. Create a `.env` file in the project root (if it doesn't exist):

    ```
    WEB_EXT_PROFILE=dev
    ```

    (You can change `dev` to any Firefox profile name you want to use.)

2. create a web-ext-config.mjs with the following

```js
import dotenv from "dotenv";
dotenv.config();

export default {
    run: {
        firefoxProfile: "dev",
        startUrl: ["https://www.overleaf.com/project"],
    },
};
```

3. Run the extension in Firefox with your profile:

    ```
    npm run dev:full
    ```

# Steps to run with any browser

Or alternatively run the following in and add the extension manually in your preferred browser

    ```
    npm run dev
    ```

The `.env` file is ignored by git and should not be committed.
