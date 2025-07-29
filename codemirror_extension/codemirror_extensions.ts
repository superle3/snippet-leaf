import {
    EditorSelection,
    StateEffect,
    StateField,
    Prec,
    Facet,
    ChangeSet,
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
import type { LatexSuitePluginSettings } from "src/settings/settings";
import {
    DEFAULT_SETTINGS,
    getSettingsSnippets,
    getSettingsSnippetVariables,
} from "src/settings/settings";

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
};

export function latex_suite(
    options: LatexSuitePluginSettings = DEFAULT_SETTINGS
) {
    return main(codeMirrorExt, options);
}

export default {
    latex_suite,
    DEFAULT_SETTINGS,
    getSettingsSnippetVariables,
    getSettingsSnippets,
};
