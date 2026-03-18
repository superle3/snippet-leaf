import type { EditorView } from "@codemirror/view";
import { setCursor } from "src/utils/editor_utils";
import { getLatexSuiteConfig } from "src/settings/settings";
import { getContextPlugin } from "src/latex_context/context";
import { queueSnippet } from "src/snippets/codemirror/snippet_queue_state_field";
import { expandSnippets } from "src/snippets/snippet_management";

export const runMatrixShortcuts = (
    view: EditorView,
    key: string,
    shiftKey: boolean,
): boolean => {
    const settings = getLatexSuiteConfig(view);
    const ctx = getContextPlugin(view);

    // Check whether we are inside a matrix / align / case environment
    const envName = ctx.getEnvironmentName();
    if (!envName || !settings.matrixShortcutsEnvNames.includes(envName)) {
        return false;
    }
    // Take main cursor since ctx.mode takes the main cursor, weird behaviour is expected with multicursor because of this.
    if (key === "Tab" && view.state.selection.main.empty) {
        view.dispatch(view.state.replaceSelection(" & "));

        return true;
    } else if (key === "Enter") {
        if (shiftKey) {
            const end = ctx.getBounds().outer_end;
            setCursor(view, end);
        } else if (ctx.mode.blockMath) {
            // Keep current indentation
            queueSnippet(view, ctx.pos, ctx.pos, "\\\\\n@0");
            expandSnippets(view);
        } else {
            view.dispatch(view.state.replaceSelection(" \\\\ "));
        }

        return true;
    } else {
        return false;
    }
};
