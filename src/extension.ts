import { getKeymaps, handleUpdate, onKeydown } from "./latex_suite";
import type { LatexSuiteCMSettings } from "./settings/raw_settings";
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
import { createContextPlugin } from "./editor_context/context";
import { createMathBoundsPlugin } from "./editor_context/mathbounds";
import { getKeymaps as getEditorCommandKeymaps } from "./keymaps";
import { Prec, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { snippetExtensions } from "./snippets/codemirror/extensions";
import { getLatexSuiteConfigExtension } from "./snippets/codemirror/config";

export function main(settings: LatexSuitePluginSettings) {
    const CMSettings: LatexSuiteCMSettings =
        processLatexSuiteSettings(settings);
    const latexSuiteConfig = getLatexSuiteConfigExtension(CMSettings);
    const extensions: Extension[] = [];

    const snippet_leaf_extension: Extension[] = [
        Prec.highest(
            EditorView.domEventHandlers({
                keydown: function (event: KeyboardEvent, view: EditorView) {
                    return onKeydown(event, view);
                },
            }),
        ),
        EditorView.updateListener.of(handleUpdate),
        getEditorCommandKeymaps(settings),
        Prec.highest(keymap.of(getKeymaps(CMSettings))),
        latexSuiteConfig,
        createContextPlugin(),
        createMathBoundsPlugin(),
        snippetExtensions,
    ];
    extensions.push(...snippet_leaf_extension);
    const conceal_plugin = mkConcealPlugin(settings.concealRevealTimeout);

    extensions.push(conceal_plugin);

    const highlighting_brackets = [
        colorPairedBracketsPluginLowestPrec,
        highlightCursorBracketsPlugin,
    ];
    extensions.push(...highlighting_brackets);
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
        "&light .latex-suite-highlighted-bracket, &light .latex-suite-highlighted-bracket .cm-bracket, &light .latex-suite-highlighted-bracket .cm-math ":
            {
                backgroundColor: "hsla(170, 50%, 70%, 0.6)",
            },
    });

    extensions.push(light_theme_extension, dark_theme_extension);

    return { extension: extensions };
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
