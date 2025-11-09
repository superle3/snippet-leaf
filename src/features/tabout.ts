import type { EditorView } from "@codemirror/view";
import {
    replaceRange,
    setCursor,
    getCharacterAtPos,
} from "../utils/editor_utils";
import type { Context } from "../utils/context";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";

export const tabout = (
    view: EditorView,
    ctx: Context,
    syntaxTree: typeof syntaxTreeC,
): boolean => {
    if (!ctx.mode.inMath()) {
        return false;
    }
    const result = ctx.getInnerBounds(syntaxTree);
    if (!result) {
        return false;
    }
    const end = result.end;

    const pos = view.state.selection.main.to;
    const doc = view.state.doc;
    const text = doc.toString();
    // Move to the next closing bracket: }, ), ], >, |, or \\rangle
    const rangle = "\\rangle";

    for (let i = pos; i < end; i++) {
        if (["}", ")", "]", ">", "|"].includes(text.charAt(i))) {
            setCursor(view, i + 1);

            return true;
        } else if (text.slice(i, i + rangle.length) === rangle) {
            setCursor(view, i + rangle.length);

            return true;
        }
    }

    // TODO: Handle array environments better. Now tabout doesn't work inside arrays when matrix shortcuts are off.
    if (ctx.mode.array) {
        return false;
    }
    // If cursor at end of line/equation, move to next line/outside $$ symbols

    // Check whether we're at end of equation
    // Accounting for whitespace, using trim
    const textBtwnCursorAndEnd = doc.sliceString(pos, end);
    const atEnd = textBtwnCursorAndEnd.trim().length === 0;
    const { start: startOfEquation, end: endOfEquation } =
        ctx.getOuterBounds(syntaxTree);
    if (!atEnd) return false;

    // Check whether we're in inline math or a block eqn
    if (ctx.mode.inlineMath) {
        setCursor(view, endOfEquation);
    } else {
        // First, locate the $$ symbol
        const dollarLine = doc.lineAt(endOfEquation);

        // If there's no line after the equation, create one

        if (
            dollarLine.number === doc.lines &&
            startOfEquation < dollarLine.from
        ) {
            replaceRange(view, dollarLine.to, dollarLine.to, "\n");
        }

        // Finally, move outside the $$ symbol
        setCursor(view, endOfEquation);

        // Trim whitespace at beginning / end of equation
        const line = doc.lineAt(pos);
        replaceRange(view, line.from, line.to, line.text.trim());
    }

    return true;
};

export const shouldTaboutByCloseBracket = (
    view: EditorView,
    keyPressed: string,
) => {
    const sel = view.state.selection.main;
    if (!sel.empty) return;
    const pos = sel.from;

    const c = getCharacterAtPos(view, pos);
    const brackets = [")", "]", "}"];

    if (c === keyPressed && brackets.includes(c)) {
        return true;
    } else {
        return false;
    }
};
