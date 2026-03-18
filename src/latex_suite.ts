import type { EditorView, ViewUpdate } from "@codemirror/view";

import { runSnippets } from "./features/run_snippets";
import { runAutoFraction } from "./features/autofraction";
import { tabout, shouldTaboutByCloseBracket } from "./features/tabout";
import { runMatrixShortcuts } from "./features/matrix_shortcuts";

import { getContextPlugin } from "./latex_context/context";
import { replaceRange } from "./utils/editor_utils";
import { setSelectionToNextTabstop } from "./snippets/snippet_management";
import { removeAllTabstops } from "./snippets/codemirror/tabstops_state_field";
import { getLatexSuiteConfig } from "./settings/settings";

// import { handleMathTooltip } from "./editor_extensions/math_tooltip";
import { isComposing } from "./utils/editor_utils";
import { clearSnippetQueue } from "./snippets/codemirror/snippet_queue_state_field";
import { handleUndoRedo } from "./snippets/codemirror/history";

export const handleUpdate = (update: ViewUpdate) => {
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
): boolean | void => {
    const success = handleKeydown(
        event.key,
        event.shiftKey,
        event.ctrlKey || event.metaKey,
        isComposing(view, event),
        view,
    );

    if (success) event.preventDefault();
};

export const handleKeydown = (
    key: string,
    shiftKey: boolean,
    ctrlKey: boolean,
    isIME: boolean,
    view: EditorView,
) => {
    const settings = getLatexSuiteConfig(view);
    if (
        !(
            settings.autoDelete$ ||
            settings.snippetsEnabled ||
            settings.autofractionEnabled ||
            settings.matrixShortcutsEnabled ||
            settings.taboutEnabled
        )
    ) {
        return false;
    }
    const ctx = getContextPlugin(view);

    let success = false;

    /*
     * When backspace is pressed, if the cursor is inside an empty inline math,
     * delete both $ symbols, not just the first one.
     */
    if (settings.autoDelete$ && key === "Backspace" && ctx.mode.inMath()) {
        const characters = view.state.sliceDoc(ctx.pos - 2, ctx.pos + 2);
        console.log(characters);

        if (characters.slice(1, 3) === "$$") {
            replaceRange(view, ctx.pos - 1, ctx.pos + 1, "");
            // Note: not sure if removeAllTabstops is necessary
            removeAllTabstops(view);
            return true;
        } else if (characters === "\\(\\)" || characters === "\\[\\]") {
            replaceRange(view, ctx.pos - 2, ctx.pos + 2, "");
            return true;
        }
    }

    if (settings.snippetsEnabled) {
        // Prevent IME from triggering keydown events.
        if (settings.suppressSnippetTriggerOnIME && isIME) return;

        // Allows Ctrl + z for undo, instead of triggering a snippet ending with z
        if (!ctrlKey) {
            try {
                success = runSnippets(view, key);
                if (success) return true;
            } catch (e) {
                clearSnippetQueue();
                console.error(e);
            }
        }
    }

    if (key === "Tab") {
        success = setSelectionToNextTabstop(view);

        if (success) return true;
    }

    if (settings.autofractionEnabled && ctx.mode.strictlyInMath()) {
        if (key === "/") {
            success = runAutoFraction(view);

            if (success) return true;
        }
    }

    if (settings.matrixShortcutsEnabled && ctx.mode.strictlyInMath()) {
        if (["Tab", "Enter"].includes(key)) {
            success = runMatrixShortcuts(view, key, shiftKey);

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
            success = tabout(view);

            if (success) return true;
        }
    }

    return false;
};
