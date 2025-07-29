import type { EditorView as EditorViewC } from "@codemirror/view";
import { findMatchingBracket } from "src/utils/editor_utils";
import type { snippetQueues } from "src/snippets/codemirror/snippet_queue_state_field";
import { Context } from "src/utils/context";
import type { LatexSuiteFacet } from "src/settings/settings";
import { getLatexSuiteConfig } from "src/settings/settings";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";

export const autoEnlargeBrackets = (
    view: EditorViewC,
    latexSuiteConfig: LatexSuiteFacet,
    syntaxTree: typeof syntaxTreeC,
    queueSnippet: ReturnType<typeof snippetQueues>["queueSnippet"],
    expandSnippets: (view: EditorViewC) => boolean
) => {
    const settings = getLatexSuiteConfig(view, latexSuiteConfig);
    if (!settings.autoEnlargeBrackets) return;

    // The Context needs to be regenerated since changes to the document may have happened before autoEnlargeBrackets was triggered
    const ctx = Context.fromView(view, latexSuiteConfig, syntaxTree);
    const result = ctx.getBounds(syntaxTree);
    if (!result) return false;
    const { start, end } = result;

    const text = view.state.doc.sliceString(start, end);
    const left = "\\left";
    const right = "\\right";

    const brackets: { [open: string]: string } = {
        "(": ")",
        "[": "]",
        "\\{": "\\}",
        "\\langle": "\\rangle",
        "\\lvert": "\\rvert",
        "\\lVert": "\\rVert",
        "\\lceil": "\\rceil",
        "\\lfloor": "\\rfloor",
    } as const;
    const openBrackets = Object.keys(brackets);
    for (let i = 0; i < text.length; i++) {
        let found = false;
        let open = "";

        for (const openBracket of openBrackets) {
            if (text.slice(i, i + openBracket.length) === openBracket) {
                found = true;
                open = openBracket;
                break;
            }
        }

        if (!found) continue;
        const bracketSize = open.length;
        const close = brackets[open];

        const j = findMatchingBracket(text, i, open, close, false, end);
        if (j === -1) continue;

        // If \left and \right already inserted, ignore
        if (
            text.slice(i - left.length, i) === left &&
            text.slice(j - right.length, j) === right
        ) {
            continue;
        }

        // Check whether the brackets contain sum, int or frac
        const bracketContents = text.slice(i + 1, j);
        const containsTrigger = settings.autoEnlargeBracketsTriggers.some(
            (word) => bracketContents.includes("\\" + word)
        );

        if (!containsTrigger) {
            i = j;
            continue;
        }

        // Enlarge the brackets
        queueSnippet(
            view,
            start + i,
            start + i + bracketSize,
            left + open + " "
        );
        queueSnippet(
            view,
            start + j,
            start + j + bracketSize,
            " " + right + close
        );
    }

    expandSnippets(view);
};
