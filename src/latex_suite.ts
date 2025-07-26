import type { EditorView, ViewUpdate } from "@codemirror/view";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";

import { runSnippets } from "./features/run_snippets";
import { runAutoFraction } from "./features/autofraction";
import { tabout, shouldTaboutByCloseBracket } from "./features/tabout";
import { runMatrixShortcuts } from "./features/matrix_shortcuts";

import { Context } from "./utils/context";
import { getCharacterAtPos, replaceRange } from "./utils/editor_utils";
import {
    type expandSnippetsC,
    setSelectionToNextTabstop,
} from "./snippets/snippet_management";
import type { create_tabstopsStateField } from "./snippets/codemirror/tabstops_state_field";
import type { LatexSuiteFacet } from "./settings/settings";
import { getLatexSuiteConfig } from "./settings/settings";
import type { snippetQueues } from "./snippets/codemirror/snippet_queue_state_field";
import type { stateEffect_variables } from "./snippets/codemirror/history";

// import { handleMathTooltip } from "./editor_extensions/math_tooltip";
import { isComposing } from "./utils/editor_utils";

export const handleUpdate = (
    update: ViewUpdate,
    latexSuiteConfig: LatexSuiteFacet,
    handleUndoRedo: ReturnType<typeof stateEffect_variables>["handleUndoRedo"]
) => {
    // const settings = getLatexSuiteConfig(update.state, latexSuiteConfig);

    // The math tooltip handler is driven by view updates because it utilizes
    // information about visual line, which is not available in EditorState
    // if (settings.mathPreviewEnabled) {
    //     handleMathTooltip(update);
    // }

    handleUndoRedo(update);
};

export const onKeydown = (
    event: KeyboardEvent,
    view: EditorView,
    latexSuiteConfig: LatexSuiteFacet,
    syntaxTree: typeof syntaxTreeC,
    removeAllTabstops: ReturnType<
        typeof create_tabstopsStateField
    >["removeAllTabstops"],
    tabstopsStateField: ReturnType<
        typeof create_tabstopsStateField
    >["tabstopsStateField"],
    clearSnippetQueue: ReturnType<typeof snippetQueues>["clearSnippetQueue"],
    queueSnippet: ReturnType<typeof snippetQueues>["queueSnippet"],
    expandSnippets: expandSnippetsC
): boolean | void => {
    const success = handleKeydown(
        event.key,
        event.shiftKey,
        event.ctrlKey || event.metaKey,
        isComposing(view, event),
        view,
        latexSuiteConfig,
        syntaxTree,
        removeAllTabstops,
        tabstopsStateField,
        clearSnippetQueue,
        queueSnippet,
        expandSnippets
    );

    if (success) event.preventDefault();
};

export const handleKeydown = (
    key: string,
    shiftKey: boolean,
    ctrlKey: boolean,
    isIME: boolean,
    view: EditorView,
    latexSuiteConfig: LatexSuiteFacet,
    syntaxTree: typeof syntaxTreeC,
    removeAllTabstops: ReturnType<
        typeof create_tabstopsStateField
    >["removeAllTabstops"],
    tabstopsStateField: ReturnType<
        typeof create_tabstopsStateField
    >["tabstopsStateField"],
    clearSnippetQueue: ReturnType<typeof snippetQueues>["clearSnippetQueue"],
    queueSnippet: ReturnType<typeof snippetQueues>["queueSnippet"],
    expandSnippets: expandSnippetsC
) => {
    const settings = getLatexSuiteConfig(view, latexSuiteConfig);
    const ctx = Context.fromView(view, latexSuiteConfig, syntaxTree);

    let success = false;

    /*
     * When backspace is pressed, if the cursor is inside an empty inline math,
     * delete both $ symbols, not just the first one.
     */
    if (settings.autoDelete$ && key === "Backspace" && ctx.mode.inMath()) {
        const charAtPos = getCharacterAtPos(view, ctx.pos);
        const charAtPrevPos = getCharacterAtPos(view, ctx.pos - 1);

        if (charAtPos === "$" && charAtPrevPos === "$") {
            replaceRange(view, ctx.pos - 1, ctx.pos + 1, "");
            // Note: not sure if removeAllTabstops is necessary
            removeAllTabstops(view);
            return true;
        }
    }

    if (settings.snippetsEnabled) {
        // Prevent IME from triggering keydown events.
        if (settings.suppressSnippetTriggerOnIME && isIME) return;

        // Allows Ctrl + z for undo, instead of triggering a snippet ending with z
        if (!ctrlKey) {
            try {
                success = runSnippets(
                    view,
                    ctx,
                    key,
                    latexSuiteConfig,
                    queueSnippet,
                    expandSnippets,
                    syntaxTree
                );
                if (success) return true;
            } catch (e) {
                clearSnippetQueue(view);
                console.error(e);
            }
        }
    }

    if (key === "Tab") {
        success = setSelectionToNextTabstop(view, tabstopsStateField);

        if (success) return true;
    }

    if (settings.autofractionEnabled && ctx.mode.strictlyInMath()) {
        if (key === "/") {
            success = runAutoFraction(
                view,
                ctx,
                latexSuiteConfig,
                syntaxTree,
                queueSnippet,
                expandSnippets
            );

            if (success) return true;
        }
    }

    if (settings.matrixShortcutsEnabled && ctx.mode.strictlyInMath()) {
        if (["Tab", "Enter"].includes(key)) {
            success = runMatrixShortcuts(
                view,
                ctx,
                key,
                shiftKey,
                latexSuiteConfig,
                syntaxTree
            );

            if (success) return true;
        }
    }

    if (settings.taboutEnabled) {
        // check if the main cursor has something selected since ctx.mode only checks the main cursor.
        //  This does give weird behaviour with multicursor.
        if (
            (key === "Tab" && view.state.selection.main.empty) ||
            shouldTaboutByCloseBracket(view, key)
        ) {
            success = tabout(view, ctx, syntaxTree);

            if (success) return true;
        }
    }

    return false;
};
