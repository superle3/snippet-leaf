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
import logger from "./logger";
import { handleUpdate, onKeydown } from "./latex_suite";
// import { create_snippet_extensions } from "./snippets/codemirror/extensions";
import type { SnippetVariables } from "./snippets/parse";
import { parseSnippets, parseSnippetVariables } from "./snippets/parse";
import { DEFAULT_SNIPPET_VARIABLES } from "./utils/default_snippet_variables";
import { DEFAULT_SNIPPETS } from "./utils/default_snippets";
import type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
} from "./snippets/codemirror/config";
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
    console.log("starting snippet_leaf", e);
    const evt = e as unknown as Overleaf_event;
    const { CodeMirror, extensions } = evt.detail;
    const {
        Prec,
        keymap,
        EditorView,
        syntaxTree,
        Decoration,
        EditorSelection,
        StateField,
        StateEffect,
        invertedEffects,
        ChangeSet,
        isolateHistory,
        undo,
        redo,
    } = CodeMirror;
    const user_variables: string = null;
    const raw_variables =
        user_variables ?? (DEFAULT_SNIPPET_VARIABLES as string);
    const tempSnippetVariables = await getSettingsSnippetVariables(
        raw_variables
    );

    const user_snippets: string = null;
    const raw_snippets = user_snippets ?? DEFAULT_SNIPPETS;

    const tempSnippets = await getSettingsSnippets(
        raw_snippets,
        tempSnippetVariables
    );

    /**keep data empty for now, but in the future its supposed to be the user stored settings */
    const data = {};
    const settings: LatexSuitePluginSettings = Object.assign(
        {},
        DEFAULT_SETTINGS,
        data
    );
    const CMSettings: LatexSuiteCMSettings = processLatexSuiteSettings(
        tempSnippets,
        settings
    );

    const Facet = Object.getPrototypeOf(keymap).constructor as typeof FacetC;

    const latexSuiteConfig = Facet.define<
        LatexSuiteCMSettings,
        LatexSuiteCMSettings
    >({
        combine: (input) => {
            const settings =
                input.length > 0
                    ? input[0]
                    : processLatexSuiteSettings([], DEFAULT_SETTINGS);
            return settings;
        },
    });
    console.log("processing");
    while (extensions.length > 0) {
        extensions.pop();
    }
    const { handleUndoRedo, endSnippet, startSnippet, snippetInvertedEffects } =
        stateEffect_variables(
            StateEffect,
            invertedEffects,
            undo,
            redo,
            StateField,
            Decoration,
            EditorView
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
        EditorView
    );
    const { clearSnippetQueue, queueSnippet, snippetQueueStateField } =
        snippetQueues(StateEffect, StateField);
    const snippet_leaf_extension = [
        latexSuiteConfig.of(CMSettings),
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
                                Decoration
                            )
                    );
                },
            })
        ),
        EditorView.updateListener.of((update: ViewUpdateC) =>
            handleUpdate(update, latexSuiteConfig, handleUndoRedo)
        ),
        create_snippet_extensions(
            tabstopsStateField,
            snippetQueueStateField,
            snippetInvertedEffects
        ),
    ];
    extensions.push(...snippet_leaf_extension);
    console.log("Latex Suite loaded with settings: ");
});

async function getSettingsSnippetVariables(snippetVariables: string) {
    try {
        return await parseSnippetVariables(snippetVariables);
    } catch (e) {
        logger.error(`Failed to load snippet variables from settings: ${e}`);
        return {};
    }
}

async function getSettingsSnippets(
    snippets: string,
    snippetVariables: SnippetVariables
) {
    try {
        return await parseSnippets(snippets, snippetVariables);
    } catch (e) {
        logger.error(`Failed to load snippets from settings: ${e}`);
        return [];
    }
}
