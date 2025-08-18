/// <reference types="firefox-webext-browser" />

import { compressToUint8Array, decompressFromUint8Array } from "lz-string";
import { DEFAULT_SETTINGS_RAW } from "../../src/settings/settings";

async function send_config(): Promise<void> {
    const config = await get_settings();
    document.dispatchEvent(
        new CustomEvent("snippet_leaf_config_send", {
            detail: JSON.stringify(config),
            bubbles: true,
            cancelable: true,
        }),
    );
}

document.addEventListener("snippet_leaf_config_listen", async () => {
    await send_config();
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
        send_config();
    }
});

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    return btoa(String.fromCharCode(...uint8Array));
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
}

export async function get_settings() {
    const version = await browser.storage.sync.get("version");
    if (!version.version) {
        await browser.storage.sync.clear();
        await browser.storage.sync.set({ version: 1 });

        await store_settings(DEFAULT_SETTINGS_RAW);
        return DEFAULT_SETTINGS_RAW;
    }
    const settings = await browser.storage.sync.get(
        Object.entries(DEFAULT_SETTINGS_RAW).reduce(
            (acc, [key, value]) => {
                if (key === "snippets" || key === "snippetVariables")
                    return acc;
                acc[key] = value;
                return acc;
            },
            {} as Record<string, string | boolean | number>,
        ),
    );
    settings.snippets = await get_decompressed("snippets");
    settings.snippetVariables = await get_decompressed("snippetVariables");

    return settings;
}

async function store_compressed(key: string, value: Uint8Array): Promise<void> {
    const CHUNK_SIZE = Math.ceil(8000 / 3); // 7.5KB per chunk
    const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
        const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        try {
            const base64Chunk = uint8ArrayToBase64(chunk);
            if (base64Chunk.length > 7500) {
                console.error(
                    `Chunk ${i + 1} exceeds maximum size of 7500 characters: ${base64Chunk.length}`,
                );
                continue;
            }
            await browser.storage.sync.set({
                [`${key}${i + 1}`]: uint8ArrayToBase64(chunk),
            });
        } catch (error) {
            console.error(`Error setting ${key}${i + 1} in storage:`, error);
        }
    }
    try {
        await browser.storage.sync.set({
            [`${key}_number`]: totalChunks,
        });
    } catch (error) {
        console.error(`Error setting ${key}_number in storage:`, error);
    }
}

async function get_decompressed(key: string): Promise<string> {
    const settings = (await browser.storage.sync.get(
        `${key}_number`,
    )) as Record<string, number>;
    if (!settings) {
        console.error(`No chunks found for ${key}`);
        return "";
    }
    const total_chunks = settings[`${key}_number`];
    const chunks = Array.from(
        { length: total_chunks },
        (_, i) => `${key}${i + 1}`,
    );
    const results = await browser.storage.sync.get(chunks);
    const results_joined = Array.from(
        { length: total_chunks },
        (_, i) => results[`${key}${i + 1}`],
    );
    return decompressFromUint8Array(
        base64ToUint8Array(results_joined.join("")),
    );
}

async function store_settings(
    settings: typeof DEFAULT_SETTINGS_RAW = DEFAULT_SETTINGS_RAW,
): Promise<void> {
    const compressedSnippets = compressToUint8Array(settings.snippets);
    const compressedSnippetVariables = compressToUint8Array(
        settings.snippetVariables,
    );
    const results: Promise<void>[] = [];

    results.push(
        browser.storage.sync.set({
            ...Object.entries(settings).reduce(
                (acc, [key, value]) => {
                    if (key === "snippets" || key === "snippetVariables")
                        return acc;
                    acc[key] = value;
                    return acc;
                },
                {} as Record<string, string | boolean | number>,
            ),
        }),
    );
    results.push(
        store_compressed("snippets", compressedSnippets),
        store_compressed("snippetVariables", compressedSnippetVariables),
    );
    await Promise.all(results);
}
