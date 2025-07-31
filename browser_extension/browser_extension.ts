import type {
    EditorSelection as EditorSelectionC,
    Extension as ExtensionC,
    StateEffect as StateEffectC,
    StateField as StateFieldC,
    Prec as PrecC,
    Facet as FacetC,
    RangeSet as RangeSetC,
    RangeValue as RangeValueC,
    RangeSetBuilder as RangeSetBuilderC,
    ChangeSet as ChangeSetC,
} from "@codemirror/state";
import type {
    undo as undoC,
    redo as redoC,
    isolateHistory as isolateHistoryC,
    invertedEffects as invertedEffectsC,
} from "@codemirror/commands";
import type {
    Decoration as DecorationC,
    EditorView as EditorViewC,
    KeyBinding as KeyBindingC,
    ViewPlugin as ViewPluginC,
    ViewUpdate as ViewUpdateC,
    WidgetType as WidgetTypeC,
    hoverTooltip as hoverTooltipC,
} from "@codemirror/view";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";
import type {
    CodeMirror as CodeMirrorVimC,
    Vim as VimC,
    getCM as getCMC,
} from "@replit/codemirror-vim";

import { main } from "../src/extension";
import {
    RangeSet,
    RangeSetBuilder,
    RangeValue,
} from "./codemirror_range_objects";
import { DEFAULT_SETTINGS } from "src/settings/settings";

type CodeMirrorExt = {
    Decoration: typeof DecorationC;
    EditorSelection: typeof EditorSelectionC;
    EditorView: typeof EditorViewC;
    Prec: typeof PrecC;
    StateField: typeof StateFieldC;
    StateEffect: typeof StateEffectC;
    ViewPlugin: typeof ViewPluginC;
    ViewUpdate: typeof ViewUpdateC;
    WidgetType: typeof WidgetTypeC;
    hoverTooltip: typeof hoverTooltipC;
    keymap: FacetC<readonly KeyBindingC[]>;
    syntaxTree: typeof syntaxTreeC;
    invertedEffects: typeof invertedEffectsC;
    ChangeSet: typeof ChangeSetC;
    undo: typeof undoC;
    redo: typeof redoC;
    isolateHistory: typeof isolateHistoryC;
};

type CodeMirrorVimExt = {
    Vim: typeof VimC;
    getCM: typeof getCMC;
    CodeMirror: typeof CodeMirrorVimC;
};
type extraExtensions = {
    RangeSet: typeof RangeSetC;
    RangeValue: typeof RangeValueC;
    RangeSetBuilder: typeof RangeSetBuilderC;
};

type OverleafEventDetail = {
    CodeMirror: CodeMirrorExt;
    extensions: ExtensionC[];
    CodeMirrorVim: CodeMirrorVimExt;
    extraExtensions?: extraExtensions;
};

type Overleaf_event = CustomEvent<OverleafEventDetail>;

window.addEventListener("UNSTABLE_editor:extensions", async (e) => {
    const evt = e as unknown as Overleaf_event;
    const { CodeMirror, extensions } = evt.detail;
    const { keymap } = CodeMirror;
    const Facet = Object.getPrototypeOf(keymap).constructor as typeof FacetC;
    const { extension: latex_suite_extensions } = await main(
        {
            ...CodeMirror,
            Facet,
            //@ts-ignore
            RangeSet,
            //@ts-ignore
            RangeSetBuilder,
            RangeValue,
        },
        DEFAULT_SETTINGS,
    );
    extensions.push(latex_suite_extensions);
});
