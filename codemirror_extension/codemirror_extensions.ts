import {
    EditorSelection,
    StateEffect,
    StateField,
    Prec,
    Facet,
    ChangeSet,
    RangeValue,
    RangeSet,
    RangeSetBuilder,
} from "@codemirror/state";
import {
    undo,
    redo,
    isolateHistory,
    invertedEffects,
} from "@codemirror/commands";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
    hoverTooltip,
    keymap,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

import { main } from "../src/extension";
import type { LatexSuitePluginSettings } from "../src/settings/settings";
import {
    DEFAULT_SETTINGS,
    DEFAULT_SETTINGS_RAW,
    getSettingsSnippets,
    getSettingsSnippetVariables,
    SETTINGS_EXPLANATIONS,
} from "../src/settings/settings";
import {
    DEFAULT_SNIPPETS,
    DEFAULT_SNIPPETS_str,
} from "src/utils/default_snippets";
import {
    DEFAULT_SNIPPET_VARIABLES,
    DEFAULT_SNIPPET_VARIABLES_str,
} from "src/utils/default_snippet_variables";
import {
    parseSnippets,
    parseSnippetsSync,
    parseSnippetVariables,
    parseSnippetVariablesSync,
} from "src/snippets/parse";

const codeMirrorExt = {
    Decoration,
    EditorSelection,
    EditorView,
    Prec,
    StateField,
    StateEffect,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
    hoverTooltip,
    keymap,
    syntaxTree,
    invertedEffects,
    ChangeSet,
    undo,
    redo,
    isolateHistory,
    Facet,
    RangeValue,
    RangeSet,
    RangeSetBuilder,
};
export function latex_suite(
    options: LatexSuitePluginSettings = DEFAULT_SETTINGS,
) {
    return main(codeMirrorExt, options);
}
export {
    DEFAULT_SETTINGS,
    SETTINGS_EXPLANATIONS,
    getSettingsSnippetVariables,
    getSettingsSnippets,
    DEFAULT_SETTINGS_RAW,
    DEFAULT_SNIPPETS_str,
    DEFAULT_SNIPPETS,
    DEFAULT_SNIPPET_VARIABLES,
    DEFAULT_SNIPPET_VARIABLES_str,
    parseSnippetsSync,
    parseSnippets,
    parseSnippetVariablesSync,
    parseSnippetVariables,
};

export type { RawSnippet, SnippetVariables } from "../src/extension";
export type {
    LatexSuitePluginSettingsRaw,
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
    LatexSuiteFacet,
    LatexSuitePluginSettingsExplanations,
} from "../src/settings/settings";
export type { Snippet } from "../src/snippets/snippets.ts";
