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
import type {
    LatexSuiteCMSettings,
    LatexSuiteFacet,
} from "./settings/settings";
import type { LatexSuitePluginSettings } from "./settings/settings";
import { create_snippet_extensions } from "./snippets/codemirror/extensions";
import type { invertedEffects as invertedEffectsC } from "@codemirror/commands";
import {
    DEFAULT_SETTINGS,
    processLatexSuiteSettings,
} from "./settings/settings";
import { expandSnippets } from "./snippets/snippet_management";
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
    const {
        Prec,
        ViewPlugin,
        EditorView,
        syntaxTree,
        Decoration,
        WidgetType,
        EditorSelection,
        StateField,
        StateEffect,
        invertedEffects,
        ChangeSet,
        isolateHistory,
        undo,
        redo,
        RangeSet,
        RangeSetBuilder,
        RangeValue,
        Facet,
    } = codemirror_objects;
    const CMSettings: LatexSuiteCMSettings =
        processLatexSuiteSettings(settings);
    const { handleUndoRedo, endSnippet, startSnippet, snippetInvertedEffects } =
        stateEffect_variables(
            StateEffect,
            invertedEffects,
            undo,
            redo,
            StateField,
            Decoration,
            EditorView,
        );
    const {
        addTabstops,
        getNextTabstopColor,
        getTabstopGroupsFromView,
        removeAllTabstops,
        tabstopsStateField,
    } = create_tabstopsStateField(
        StateEffect,
        StateField,
        Decoration,
        EditorView,
    );
    const extensions: ExtensionC[] = [];

    const latexSuiteConfig: LatexSuiteFacet = Facet.define<
        Partial<LatexSuitePluginSettings>,
        LatexSuiteCMSettings
    >({
        combine: (input: Partial<LatexSuitePluginSettings>[]) => {
            const settings =
                input.length > 0
                    ? processLatexSuiteSettings(
                          Object.assign({}, DEFAULT_SETTINGS, ...input),
                      )
                    : processLatexSuiteSettings(DEFAULT_SETTINGS);
            return settings;
        },
    });
    const snippet_leaf_extension = [
        Prec.highest(
            EditorView.domEventHandlers({
                keydown: function (event: KeyboardEvent, view: EditorViewC) {
                    return onKeydown(
                        event,
                        view,
                        latexSuiteConfig,
                        syntaxTree,
                        removeAllTabstops,
                        tabstopsStateField,
                        (view: EditorViewC) =>
                            expandSnippets(
                                view,
                                ChangeSet,
                                isolateHistory,
                                addTabstops,
                                getTabstopGroupsFromView,
                                getNextTabstopColor,
                                startSnippet,
                                endSnippet,
                                EditorSelection,
                                Decoration,
                            ),
                    );
                },
            }),
        ),
        EditorView.updateListener.of((update: ViewUpdateC) =>
            handleUpdate(update, latexSuiteConfig, handleUndoRedo),
        ),
        create_snippet_extensions(tabstopsStateField, snippetInvertedEffects),
        latexSuiteConfig.of(CMSettings),
    ];
    extensions.push(...snippet_leaf_extension);
    const conceal_plugin = mkConcealPlugin(
        settings.concealRevealTimeout,
        ViewPlugin,
        EditorView,
        Decoration,
        WidgetType,
        RangeSet,
        RangeSetBuilder,
        RangeValue,
        syntaxTree,
        latexSuiteConfig,
    );

    extensions.push(conceal_plugin);

    const highlighting_brackets = [
        colorPairedBracketsPluginLowestPrec(
            Prec,
            ViewPlugin,
            Decoration,
            syntaxTree,
            latexSuiteConfig,
        ),
        highlightCursorBracketsPlugin(
            ViewPlugin,
            Decoration,
            latexSuiteConfig,
            syntaxTree,
        ),
    ];
    extensions.push(...highlighting_brackets);
    const dark_theme_extension = EditorView.theme(
        {
            '.latex-suite-color-bracket-0-dark, .latex-suite-color-bracket-0-dark [class^="tok-"], .latex-suite-color-bracket-0-dark .cm-bracket, .latex-suite-color-bracket-0-dark .cm-math':
                {
                    color: "#47b8ff",
                },
            '.latex-suite-color-bracket-1-dark, .latex-suite-color-bracket-1-dark [class^="tok-"], .latex-suite-color-bracket-1-dark .cm-bracket, .latex-suite-color-bracket-1-dark .cm-math':
                {
                    color: "#ff55cd",
                },
            '.latex-suite-color-bracket-2-dark, .latex-suite-color-bracket-2-dark [class^="tok-"], .latex-suite-color-bracket-2-dark .cm-bracket, .latex-suite-color-bracket-2-dark .cm-math':
                {
                    color: "#73ff63",
                },
            ".latex-suite-highlighted-bracket-dark, .latex-suite-highlighted-bracket-dark .cm-bracket, .latex-suite-highlighted-bracket-dark .cm-math ":
                {
                    backgroundColor: "hsla(170, 50%, 40%, 0.3)",
                },
        },
        { dark: true },
    );

    const light_theme_extension = EditorView.theme(
        {
            '.latex-suite-color-bracket-0-light, .latex-suite-color-bracket-0-light [class^="tok-"], .latex-suite-color-bracket-0-light .cm-bracket, .latex-suite-color-bracket-0-light .cm-math':
                {
                    color: "#527aff",
                },
            '.latex-suite-color-bracket-1-light, .latex-suite-color-bracket-1-light [class^="tok-"], .latex-suite-color-bracket-1-light .cm-bracket, .latex-suite-color-bracket-1-light .cm-math':
                {
                    color: "#ff50b7",
                },
            '.latex-suite-color-bracket-2-light, .latex-suite-color-bracket-2-light [class^="tok-"], .latex-suite-color-bracket-2-light .cm-bracket, .latex-suite-color-bracket-2-light .cm-math':
                {
                    color: "#69ba00",
                },
            ".latex-suite-highlighted-bracket-light, .latex-suite-highlighted-bracket-light .cm-bracket, .latex-suite-highlighted-bracket-light .cm-math ":
                {
                    backgroundColor: "hsla(170, 50%, 70%, 0.6)",
                },
        },
        { dark: false },
    );

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
