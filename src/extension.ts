import {
    getKeymaps,
    handleUpdate,
    keyboardEventPlugin,
    onInput,
    snippetStateField,
} from "./latex_suite";
import type {
    LatexSuiteCMSettings,
    LatexSuiteIntermediateSettings,
} from "./settings/raw_settings";
import type { LatexSuitePluginSettings } from "./settings/raw_settings";
import { processLatexSuiteSettings } from "./settings/settings";
import { mkConcealPlugin } from "./editor_extensions/conceal";

import type { SnippetVariables, RawSnippet } from "./snippets/parse";
import type { TabstopGroup } from "./snippets/tabstop";
import type { ProcessSnippetResult, SnippetData } from "./snippets/snippets";
import {
    colorPairedBracketsPluginLowestPrec,
    highlightCursorBracketsPlugin,
} from "./editor_extensions/highlight_brackets";
import { mathBoundsPlugin } from "./editor_context/mathbounds";
import { getKeymaps as getEditorCommandKeymaps } from "./keymaps";
import { Prec, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { snippetExtensions } from "./snippets/codemirror/extensions";
import { getLatexSuiteConfigExtension } from "./snippets/codemirror/config";
import { contextPlugin } from "./editor_context/context";
import { getFileConfigExtension } from "./editor_extensions/obsidian_utils";
import { api, type PluginSnippetApi } from "src/snippets/luasnip_api";
import type { CodeMirrorExt } from "browser_extension/set_codemirror_objects";
import * as v from "valibot";
import { SettingsSchema } from "./settings/setting_schemas";

export function main(settings: LatexSuitePluginSettings) {
    const CMSettings: LatexSuiteCMSettings =
        processLatexSuiteSettings(settings);
    const latexSuiteConfig = getLatexSuiteConfigExtension(CMSettings);
    const extensions: Extension[] = [];

    const snippet_leaf_extension: Extension[] = [
        Prec.highest(keyboardEventPlugin),
        Prec.highest(EditorView.inputHandler.of(onInput)),
        EditorView.updateListener.of(handleUpdate),
        getEditorCommandKeymaps(settings),
        Prec.highest(keymap.of(getKeymaps(CMSettings))),
        latexSuiteConfig,
        contextPlugin,
        mathBoundsPlugin,
        snippetExtensions,
        snippetStateField,
        getFileConfigExtension(() => null),
    ];
    extensions.push(...snippet_leaf_extension);
    const conceal_plugin = mkConcealPlugin(CMSettings);
    extensions.push(conceal_plugin);

    const dark_theme_extension = EditorView.baseTheme({
        '&dark .latex-suite-color-bracket-0, &dark .latex-suite-color-bracket-0 [class^="tok-"], &dark .latex-suite-color-bracket-0 .cm-bracket, &dark .latex-suite-color-bracket-0 .cm-math':
            {
                color: "#47b8ff",
            },
        '&dark .latex-suite-color-bracket-1, &dark .latex-suite-color-bracket-1 [class^="tok-"], &dark .latex-suite-color-bracket-1 .cm-bracket, &dark .latex-suite-color-bracket-1 .cm-math':
            {
                color: "#ff55cd",
            },
        '&dark .latex-suite-color-bracket-2, &dark .latex-suite-color-bracket-2 [class^="tok-"], &dark .latex-suite-color-bracket-2 .cm-bracket, &dark .latex-suite-color-bracket-2 .cm-math':
            {
                color: "#73ff63",
            },
        '&dark .latex-suite-mismatched-bracket, &dark .latex-suite-mismatched-bracket [class^="tok-"], &dark .latex-suite-mismatched-bracket .cm-bracket, &dark .latex-suite-mismatched-bracket .cm-math':
            {
                color: "rgb(255 18 18 / 80%)",
            },
        "&dark .latex-suite-highlighted-bracket, &dark .latex-suite-highlighted-bracket .cm-bracket, &dark .latex-suite-highlighted-bracket .cm-math ":
            {
                backgroundColor: "hsla(170, 50%, 40%, 0.3)",
            },
    });

    const light_theme_extension = EditorView.baseTheme({
        '&light .latex-suite-color-bracket-0, &light .latex-suite-color-bracket-0 [class^="tok-"], &light .latex-suite-color-bracket-0 .cm-bracket, &light .latex-suite-color-bracket-0 .cm-math':
            {
                color: "#527aff",
            },
        '&light .latex-suite-color-bracket-1, &light .latex-suite-color-bracket-1 [class^="tok-"], &light .latex-suite-color-bracket-1 .cm-bracket, &light .latex-suite-color-bracket-1 .cm-math':
            {
                color: "#ff50b7",
            },
        '&light .latex-suite-color-bracket-2, &light .latex-suite-color-bracket-2 [class^="tok-"], &light .latex-suite-color-bracket-2 .cm-bracket, &light .latex-suite-color-bracket-2 .cm-math':
            {
                color: "#69ba00",
            },
        '&light .latex-suite-mismatched-bracket, &light .latex-suite-mismatched-bracket [class^="tok-"], &light .latex-suite-mismatched-bracket .cm-bracket, &light .latex-suite-mismatched-bracket .cm-math':
            {
                color: "rgb(255 18 18 / 80%)",
            },
        "&light .latex-suite-highlighted-bracket, &light .latex-suite-highlighted-bracket .cm-bracket, &light .latex-suite-highlighted-bracket .cm-math ":
            {
                backgroundColor: "hsla(170, 50%, 70%, 0.6)",
            },
    });
    if (
        CMSettings.highlightCursorBracketsEnabled ||
        CMSettings.colorPairedBracketsEnabled
    ) {
        extensions.push(light_theme_extension, dark_theme_extension);
    }
    if (CMSettings.colorPairedBracketsEnabled) {
        extensions.push(colorPairedBracketsPluginLowestPrec);
    }
    if (CMSettings.highlightCursorBracketsEnabled) {
        extensions.push(highlightCursorBracketsPlugin);
    }

    return { extension: extensions };
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export async function parse_settings(
    settings: unknown,
): Promise<Result<LatexSuiteIntermediateSettings, unknown>> {
    try {
        const parsed = await v.parseAsync(SettingsSchema, settings);
        return { ok: true, value: parsed };
    } catch (error) {
        console.error("Error parsing settings:", error);
        return { ok: false, error };
    }
}

export type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
    RawSnippet,
    SnippetVariables,
    TabstopGroup as TabstopGroupC,
    ProcessSnippetResult,
    SnippetData,
};

declare global {
    var __snippet_leaf_api: ReturnType<typeof set_api>;
}
export function set_api(
    codemirror_objects: CodeMirrorExt,
    pluginApi: PluginSnippetApi,
) {
    const obj = {
        ...api({}, pluginApi),
        ...codemirror_objects,
    };
    globalThis.__snippet_leaf_api = obj;
    return obj;
}
