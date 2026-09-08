import type { EditorView, KeyBinding, ViewUpdate } from "@codemirror/view";

import { runSnippets } from "./features/run_snippets";
import { runAutoFraction } from "./features/autofraction";
import { tabout, shouldTaboutByCloseBracket } from "./features/tabout";

import { getContextPlugin } from "./editor_context/context";
import { replaceRange } from "./utils/editor_utils";
import { setSelectionToNextTabstop } from "./snippets/snippet_management";
import { removeAllTabstops } from "./snippets/codemirror/tabstops_state_field";
import { getLatexSuiteConfig } from "./snippets/codemirror/config";

// import { handleMathTooltip } from "./editor_extensions/math_tooltip";
import { isComposing } from "./utils/editor_utils";
import { clearSnippetQueue } from "./snippets/codemirror/snippet_queue_state_field";
import { handleUndoRedo } from "./snippets/codemirror/history";
import {
    newlineMatrixShortcut,
    exitMatrixShortCut,
    priorityTaboutMatrixShortcut,
    addCellMatrixShortcut,
} from "./features/matrix_shortcuts";
import type { LatexSuiteCMSettings } from "codemirror_extension/codemirror_extensions";

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
    _shiftKey: boolean,
    ctrlKey: boolean,
    isIME: boolean,
    view: EditorView,
) => {
    const settings = getLatexSuiteConfig(view);

    if (settings.snippetsEnabled) {
        // Prevent IME from triggering keydown events.
        if (settings.suppressSnippetTriggerOnIME && isIME) return;

        // Allows Ctrl + z for undo, instead of triggering a snippet ending with z
        if (!ctrlKey) {
            try {
                const success = runSnippets(
                    view,
                    { key, snippets: settings.snippets },
                    {
                        recursive: settings.snippetRecursion,
                        debug: settings.snippetDebug,
                    },
                );
                if (success) return true;
            } catch (e) {
                clearSnippetQueue(view);
                console.error(e);
            }
        }
    }
    return;
};

/**
 * Get the keymaps specific for Latex Suite. These keymaps only run in scope `latex-suite`.
 * @param settings The settings with the keybindings to use
 * @returns The keymaps for the LaTeX suite based on the provided settings
 */
export function getKeymaps(settings: LatexSuiteCMSettings): KeyBinding[] {
    // Order matters for keybindings,
    // as they are checked in order from the beginning of the array to the end
    const keybindings: KeyBinding[] = [];

    /*
     * When backspace is pressed, if the cursor is inside an empty inline math,
     * delete both $ symbols, not just the first one.
     */
    if (settings.autoDelete$) {
        keybindings.push({
            key: "Backspace",
            run: function autoDelete$(view: EditorView) {
                const ctx = getContextPlugin(view);
                if (!ctx.mode.inMath()) return false;

                const characters = view.state.sliceDoc(
                    ctx.pos - 2,
                    ctx.pos + 2,
                );

                if (characters.slice(1, 3) === "$$") {
                    replaceRange(view, ctx.pos - 1, ctx.pos + 1, "");
                    // Note: not sure if removeAllTabstops is necessary
                    removeAllTabstops(view);
                    return true;
                } else if (characters === "\\(\\)" || characters === "\\[\\]") {
                    replaceRange(view, ctx.pos - 2, ctx.pos + 2, "");
                    return true;
                }
                return false;
            },
        });
    }

    const snippet_triggers = new Set(
        settings.snippets.map((s) => s.triggerKey).filter((s) => s !== ""),
    );
    snippet_triggers.add(settings.snippetsTrigger);
    const runMaker = (key: string) => {
        const snippets = settings.snippets.filter(
            (s) =>
                s.triggerKey === key ||
                (!s.triggerKey &&
                    !s.options.automatic &&
                    key === settings.snippetsTrigger),
        );
        return (view: EditorView) => {
            const settings = getLatexSuiteConfig(view);
            // Prevent IME from triggering keydown events.
            if (settings.suppressSnippetTriggerOnIME && view.composing)
                return false;
            try {
                const options = {
                    recursive: settings.snippetRecursion,
                    debug: settings.snippetDebug,
                };
                return runSnippets(view, { snippets }, options);
            } catch (e) {
                clearSnippetQueue(view);
                console.error(e);
                return false;
            }
        };
    };

    if (settings.snippetsEnabled) {
        keybindings.push(
            ...Array.from(snippet_triggers, (key) => {
                return {
                    key,
                    run: runMaker(key),
                };
            }),
        );
    }

    keybindings.push({
        key: settings.snippetNextTabstopTrigger,
        run: function nextTabstop(view: EditorView) {
            return setSelectionToNextTabstop(view, false);
        },
    });

    keybindings.push({
        key: settings.snippetPreviousTabstopTrigger,
        run: function previousTabstop(view: EditorView) {
            return setSelectionToNextTabstop(view, true);
        },
    });
    if (settings.autofractionEnabled) {
        keybindings.push({
            key: settings.autofractionTrigger,
            run: function autofraction(view: EditorView) {
                if (!getLatexSuiteConfig(view).autofractionEnabled)
                    return false;
                const ctx = getContextPlugin(view);
                if (!ctx.mode.strictlyInMath()) return false;
                return runAutoFraction(view);
            },
        });
    }

    // Matrix shortcuts are intentionally put before tabout shortcuts,
    const matrixShortcuts = [
        {
            key: settings.matrixShortcutsNewlineTrigger,
            run: newlineMatrixShortcut,
        },
        {
            key: settings.matrixShortcutsCellTrigger,
            run: addCellMatrixShortcut,
        },
        {
            key: settings.matrixShortcutsExitTrigger,
            run: exitMatrixShortCut,
        },
    ];
    if (
        settings.taboutEnabled &&
        settings.taboutTrigger === settings.matrixShortcutsCellTrigger
    ) {
        matrixShortcuts.unshift({
            key: settings.taboutTrigger,
            run: priorityTaboutMatrixShortcut,
        });
    }
    if (settings.matrixShortcutsEnabled) {
        keybindings.push(...matrixShortcuts);
    }

    const taboutShortcuts = [
        {
            key: settings.taboutTrigger,
            run: function exitEquation(view: EditorView) {
                if (!view.state.selection.main.empty) return false;
                const ctx = getContextPlugin(view);
                return tabout(view, ctx);
            },
        },
        ...[")", "}", "]"].map((key) => ({
            key,
            run: function nextClosingBracket(view: EditorView) {
                if (!shouldTaboutByCloseBracket(view, key)) return false;
                const ctx = getContextPlugin(view);
                return tabout(view, ctx);
            },
        })),
    ];
    if (settings.taboutEnabled) {
        keybindings.push(...taboutShortcuts);
    }

    return keybindings;
}
