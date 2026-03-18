import type {
    EditorSelection as EditorSelectionC,
    StateEffect as StateEffectC,
    StateField as StateFieldC,
    Prec as PrecC,
    Facet as FacetC,
    ChangeSet as ChangeSetC,
    RangeValue as RangeValueC,
    RangeSet as RangeSetC,
    RangeSetBuilder as RangeSetBuilderC,
} from "@codemirror/state";
import type {
    undo as undoC,
    redo as redoC,
    isolateHistory as isolateHistoryC,
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
import type { invertedEffects as invertedEffectsC } from "@codemirror/commands";

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
    Facet: typeof FacetC;
    RangeSet: typeof RangeSetC;
    RangeValue: typeof RangeValueC;
    RangeSetBuilder: typeof RangeSetBuilderC;
};
export let Decoration: typeof DecorationC;
export let EditorSelection: typeof EditorSelectionC;
export let EditorView: typeof EditorViewC;
export let Prec: typeof PrecC;
export let StateField: typeof StateFieldC;
export let StateEffect: typeof StateEffectC;
export let ViewPlugin: typeof ViewPluginC;
export let ViewUpdate: typeof ViewUpdateC;
export let WidgetType: typeof WidgetTypeC;
export let hoverTooltip: typeof hoverTooltipC;
export let keymap: FacetC<readonly KeyBindingC[]>;
export let syntaxTree: typeof syntaxTreeC;
export let invertedEffects: typeof invertedEffectsC;
export let ChangeSet: typeof ChangeSetC;
export let undo: typeof undoC;
export let redo: typeof redoC;
export let isolateHistory: typeof isolateHistoryC;
export let Facet: typeof FacetC;
export let RangeSet: typeof RangeSetC;
export let RangeValue: typeof RangeValueC;
export let RangeSetBuilder: typeof RangeSetBuilderC;

export function set_codemirror_objects(codemirror_objects: CodeMirrorExt) {
    Decoration = codemirror_objects.Decoration;
    EditorSelection = codemirror_objects.EditorSelection;
    EditorView = codemirror_objects.EditorView;
    Prec = codemirror_objects.Prec;
    StateField = codemirror_objects.StateField;
    StateEffect = codemirror_objects.StateEffect;
    ViewPlugin = codemirror_objects.ViewPlugin;
    ViewUpdate = codemirror_objects.ViewUpdate;
    WidgetType = codemirror_objects.WidgetType;
    hoverTooltip = codemirror_objects.hoverTooltip;
    keymap = codemirror_objects.keymap;
    syntaxTree = codemirror_objects.syntaxTree;
    invertedEffects = codemirror_objects.invertedEffects;
    ChangeSet = codemirror_objects.ChangeSet;
    undo = codemirror_objects.undo;
    redo = codemirror_objects.redo;
    isolateHistory = codemirror_objects.isolateHistory;
    Facet = codemirror_objects.Facet;
    RangeSet = codemirror_objects.RangeSet;
    RangeValue = codemirror_objects.RangeValue;
    RangeSetBuilder = codemirror_objects.RangeSetBuilder;
}
