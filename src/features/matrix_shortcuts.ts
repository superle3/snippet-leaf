import type { EditorView } from "@codemirror/view";
import { setCursor } from "src/utils/editor_utils";
import { getLatexSuiteConfig } from "src/settings/settings";
import { getContextPlugin } from "src/latex_context/context";

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
            const d = view.state.doc;
            const lineText = d.lineAt(ctx.pos).text;
            const matchIndents = lineText.match(/^\s*/);
            const leadingIndents = matchIndents ? matchIndents[0] : "";

            view.dispatch(
                view.state.replaceSelection(` \\\\\n${leadingIndents}`),
            );
        } else {
            view.dispatch(view.state.replaceSelection(" \\\\ "));
        }

        return true;
    } else {
        return false;
    }
};
