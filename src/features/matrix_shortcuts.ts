import type { EditorView } from "@codemirror/view";
import { setCursor } from "src/utils/editor_utils";
import type { LatexSuiteFacet } from "src/settings/settings";
import { getLatexSuiteConfig } from "src/settings/settings";
import type { Context } from "src/utils/context";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";

export const runMatrixShortcuts = (
    view: EditorView,
    ctx: Context,
    key: string,
    shiftKey: boolean,
    latexSuiteConfig: LatexSuiteFacet,
    syntaxTree: typeof syntaxTreeC,
): boolean => {
    const settings = getLatexSuiteConfig(view, latexSuiteConfig);

    // Check whether we are inside a matrix / align / case environment
    const envName = ctx.getEnvironmentName(syntaxTree);
    if (!envName || !settings.matrixShortcutsEnvNames.includes(envName)) {
        return false;
    }
    // Take main cursor since ctx.mode takes the main cursor, weird behaviour is expected with multicursor because of this.
    if (key === "Tab" && view.state.selection.main.empty) {
        view.dispatch(view.state.replaceSelection(" & "));

        return true;
    } else if (key === "Enter") {
        if (shiftKey) {
            const bounds = ctx.getOuterBounds(syntaxTree);
            setCursor(view, bounds.end);
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
