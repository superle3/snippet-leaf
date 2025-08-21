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
} from "./settings/settings";
import { expandSnippets } from "./snippets/snippet_management";
import { stateEffect_variables } from "./snippets/codemirror/history";
import { create_tabstopsStateField } from "./snippets/codemirror/tabstops_state_field";
import { snippetQueues } from "./snippets/codemirror/snippet_queue_state_field";
import { mkConcealPlugin } from "./conceal_plugin/conceal";

import type { RawSnippet, SnippetVariables } from "./snippets/parse";
import type { TabstopGroupC } from "./snippets/tabstop";
import type { ProcessSnippetResult, SnippetData } from "./snippets/snippets";

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
    const { clearSnippetQueue, queueSnippet, snippetQueueStateField } =
        snippetQueues(StateEffect, StateField);
    const extensions: ExtensionC[] = [];

    const latexSuiteConfig = new LatexSuiteConfig(CMSettings);
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
                        clearSnippetQueue,
                        queueSnippet,
                        (view: EditorViewC) =>
                            expandSnippets(
                                view,
                                ChangeSet,
                                isolateHistory,
                                snippetQueueStateField,
                                clearSnippetQueue,
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
        create_snippet_extensions(
            tabstopsStateField,
            snippetQueueStateField,
            snippetInvertedEffects,
        ),
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
    ).extension;

    extensions.push(conceal_plugin);
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
class LatexSuiteConfig {
    value: LatexSuiteCMSettings;
    constructor(value: LatexSuiteCMSettings) {
        this.value = value;
    }
    processSettings(settings: LatexSuitePluginSettings): this | null {
        try {
            const processedSettings = processLatexSuiteSettings(settings);
            this.value = processedSettings;
            return this;
        } catch {
            return null;
        }
    }
}
