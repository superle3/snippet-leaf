import type {
    EditorSelection as EditorSelectionC,
    Extension as ExtensionC,
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
import { handleUpdate, onKeydown } from "./latex_suite";
import type { LatexSuiteCMSettings } from "./settings/settings";
import type { LatexSuitePluginSettings } from "./settings/settings";
import { create_snippet_extensions } from "./snippets/codemirror/extensions";
import type { invertedEffects as invertedEffectsC } from "@codemirror/commands";
import {
    DEFAULT_SETTINGS,
    processLatexSuiteSettings,
    setLatexSuiteConfig,
} from "./settings/settings";
import { stateEffect_variables } from "./snippets/codemirror/history";
import { create_tabstopsStateField } from "./snippets/codemirror/tabstops_state_field";
import { mkConcealPlugin } from "./conceal_plugin/conceal";

import type { RawSnippet, SnippetVariables } from "./snippets/parse";
import type { TabstopGroupC } from "./snippets/tabstop";
import type { ProcessSnippetResult, SnippetData } from "./snippets/snippets";
import {
    colorPairedBracketsPluginLowestPrec,
    highlightCursorBracketsPlugin,
} from "./highlight_brackets_plugin/highlight_brackets";
import { set_codemirror_objects } from "./set_codemirror_objects";

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

export function main(
    codemirror_objects: CodeMirrorExt,
    settings: LatexSuitePluginSettings = DEFAULT_SETTINGS,
) {
    set_codemirror_objects(codemirror_objects);
    const { Prec, EditorView } = codemirror_objects;
    const CMSettings: LatexSuiteCMSettings =
        processLatexSuiteSettings(settings);
    stateEffect_variables();
    create_tabstopsStateField();
    const latexSuiteConfig = setLatexSuiteConfig();
    const extensions: ExtensionC[] = [];

    const snippet_leaf_extension = [
        Prec.highest(
            EditorView.domEventHandlers({
                keydown: function (event: KeyboardEvent, view: EditorViewC) {
                    return onKeydown(event, view);
                },
            }),
        ),
        EditorView.updateListener.of(handleUpdate),
        create_snippet_extensions(),
        latexSuiteConfig.of(CMSettings),
    ];
    extensions.push(...snippet_leaf_extension);
    const conceal_plugin = mkConcealPlugin(settings.concealRevealTimeout);

    extensions.push(conceal_plugin);

    const highlighting_brackets = [
        colorPairedBracketsPluginLowestPrec(),
        highlightCursorBracketsPlugin(),
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

    return { latexSuiteConfig, extension: extensions };
}

export type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
    RawSnippet,
    SnippetVariables,
    TabstopGroupC,
    ProcessSnippetResult,
    SnippetData,
};
