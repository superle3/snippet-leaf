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
import { CodeMirror, Vim, getCM } from "@replit/codemirror-vim";

import { main } from "../src/extension";

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

const codeMirrorVimExt = {
    Vim,
    getCM,
    CodeMirror,
};

export async function latex_suite(options: Parameters<typeof main>[2]) {
    return main(codeMirrorExt, codeMirrorVimExt, options);
}
