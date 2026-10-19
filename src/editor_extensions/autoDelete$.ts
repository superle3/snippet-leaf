import type { EditorView } from "codemirror";
import { getContextPlugin } from "src/editor_context/context";
import { removeAllTabstops } from "src/snippets/codemirror/tabstops_state_field";
import { replaceRange } from "src/utils/editor_utils";

/*
 * When backspace is pressed, if the cursor is inside an empty inline math,
 * delete both $ symbols, not just the first one.
 */
export function autoDelete$(view: EditorView) {
    const ctx = getContextPlugin(view);
    if (!ctx.mode.inMath()) return false;

    const characters = view.state.sliceDoc(ctx.pos - 2, ctx.pos + 2);

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
}
