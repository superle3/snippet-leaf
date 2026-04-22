import type { EditorView, ViewUpdate, DecorationSet } from "@codemirror/view";
import { Decoration, ViewPlugin } from "@codemirror/view";
import { Prec, type Range } from "@codemirror/state";
import {
    findMatchingBracket,
    getOpenBracket,
    getCloseBracket,
} from "../utils/editor_utils";
import type { Context } from "src/latex_context/context";
import { getContextPlugin } from "src/latex_context/context";
import { getLatexSuiteConfig } from "src/settings/raw_settings";
import { getMathBoundsPlugin } from "src/latex_context/mathbounds";
const Ncolors = 3;

function getHighlightBracketMark(
    pos: number,
    className: string,
): Range<Decoration> {
    return Decoration.mark({
        inclusive: true,
        attributes: {},
        class: className,
    }).range(pos, pos + 1);
}

type BracketConcealment = {
    pos: number;
    className: string;
};

type ColorBracketsCachedEquations = Record<string, BracketConcealment[]>;
function colorPairedBrackets(
    view: EditorView,
    cached_equations: ColorBracketsCachedEquations,
) {
    const equations = getMathBoundsPlugin(view).getEquations(view.state);
    const new_equations: typeof cached_equations = {};
    for (const eqn of equations.values()) {
        if (eqn in cached_equations) {
            new_equations[eqn] = cached_equations[eqn];
            continue;
        }

        const openBrackets = ["{", "[", "("];
        const closeBrackets = ["}", "]", ")"];

        const bracketsStack: { char: string; pos: number }[] = [];
        const localSpecs: BracketConcealment[] = [];

        for (let i = 0; i < eqn.length; i++) {
            const char = eqn.charAt(i);

            if (openBrackets.includes(char)) {
                bracketsStack.push({ char, pos: i });
            } else if (closeBrackets.includes(char)) {
                const lastBracket = bracketsStack.at(-1);

                if (lastBracket && getCloseBracket(lastBracket.char) === char) {
                    bracketsStack.pop();
                    const lastBracketPos = lastBracket.pos;
                    const depth = bracketsStack.length % Ncolors;

                    const className = "latex-suite-color-bracket-" + depth;

                    localSpecs.push({ pos: lastBracketPos, className });
                    localSpecs.push({ pos: i, className });
                }
            }
        }
        new_equations[eqn] = localSpecs;
    }
    cached_equations = new_equations;

    const widgets: Range<Decoration>[] = [];
    for (const [start, eqn] of equations.entries()) {
        const localSpecs = new_equations[eqn];
        if (!localSpecs) continue;
        for (const spec of localSpecs) {
            widgets.push(
                getHighlightBracketMark(start + spec.pos, spec.className),
            );
        }
    }

    const decorations = Decoration.set(widgets, true);
    return { decorations, cached_equations };
}

function getEnclosingBracketsPos(view: EditorView, pos: number, ctx: Context) {
    const result = ctx.getBounds(pos);
    if (!result) return -1;
    const { inner_start: start, inner_end: end } = result;
    const text = view.state.doc.sliceString(start, end);

    for (let i = pos - start; i > 0; i--) {
        let curChar = text.charAt(i);

        if ([")", "]", "}"].includes(curChar)) {
            const closeBracket = curChar;
            const openBracket = getOpenBracket(closeBracket);

            const j = findMatchingBracket(
                text,
                i,
                openBracket,
                closeBracket,
                true,
            );

            if (j === -1) return -1;

            // Skip to the beginnning of the bracket
            i = j;
            curChar = text.charAt(i);
        } else {
            if (!["{", "(", "["].includes(curChar)) continue;

            const j = findMatchingBracket(
                text,
                i,
                curChar,
                getCloseBracket(curChar),
                false,
            );
            if (j === -1) continue;

            return { left: i + start, right: j + start };
        }
    }

    return -1;
}

function highlightCursorBrackets(view: EditorView) {
    const widgets: Range<Decoration>[] = [];
    const selection = view.state.selection;
    const ranges = selection.ranges;
    const text = view.state.doc.toString();
    const ctx = getContextPlugin(view);

    if (!ctx.mode.inMath()) {
        return Decoration.none;
    }

    const bounds = ctx.getBounds(selection.main.to);
    if (!bounds) return Decoration.none;
    const eqn = view.state.doc.sliceString(
        bounds.inner_start,
        bounds.inner_end,
    );

    const openBrackets = ["{", "[", "("];
    const brackets = ["{", "[", "(", "}", "]", ")"];

    let done = false;
    const className = "latex-suite-highlighted-bracket";
    for (const range of ranges) {
        for (let i = Math.max(0, range.from - 1); i <= range.to; i++) {
            const char = text.charAt(i);
            if (!brackets.includes(char)) continue;

            let openBracket, closeBracket;
            let backwards = false;

            if (openBrackets.includes(char)) {
                openBracket = char;
                closeBracket = getCloseBracket(openBracket);
            } else {
                closeBracket = char;
                openBracket = getOpenBracket(char);
                backwards = true;
            }

            let j = findMatchingBracket(
                eqn,
                i - bounds.inner_start,
                openBracket,
                closeBracket,
                backwards,
            );

            if (j === -1) continue;
            j = j + bounds.inner_start;

            widgets.push(getHighlightBracketMark(i, className));
            widgets.push(getHighlightBracketMark(j, className));
            done = true;
            break;
        }

        if (done) break;

        // Highlight brackets enclosing the cursor
        if (range.empty) {
            const pos = range.from - 1;

            const result = getEnclosingBracketsPos(view, pos, ctx);
            if (result === -1) continue;

            widgets.push(getHighlightBracketMark(result.left, className));
            widgets.push(getHighlightBracketMark(result.right, className));
            done = true;
            break;
        }

        if (done) break;
    }

    return Decoration.set(widgets, true);
}

const colorPairedBracketsPlugin = () =>
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;
            cached_equations: ColorBracketsCachedEquations = {};

            constructor(view: EditorView) {
                if (!getLatexSuiteConfig(view).colorPairedBracketsEnabled) {
                    this.decorations = Decoration.none;
                    return;
                }
                ({
                    decorations: this.decorations,
                    cached_equations: this.cached_equations,
                } = colorPairedBrackets(view, this.cached_equations));
            }

            update(update: ViewUpdate) {
                if (
                    !getLatexSuiteConfig(update.view).colorPairedBracketsEnabled
                ) {
                    this.decorations = Decoration.none;
                    return;
                }
                if (update.docChanged || update.viewportChanged) {
                    ({
                        decorations: this.decorations,
                        cached_equations: this.cached_equations,
                    } = colorPairedBrackets(
                        update.view,
                        this.cached_equations,
                    ));
                }
            }
        },
        { decorations: (v) => v.decorations },
    );

export const colorPairedBracketsPluginLowestPrec = () =>
    Prec.lowest(colorPairedBracketsPlugin().extension);

export const highlightCursorBracketsPlugin = () =>
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                if (!getLatexSuiteConfig(view).highlightCursorBracketsEnabled) {
                    this.decorations = Decoration.none;
                    return;
                }
                this.decorations = highlightCursorBrackets(view);
            }

            update(update: ViewUpdate) {
                if (
                    !getLatexSuiteConfig(update.view)
                        .highlightCursorBracketsEnabled
                ) {
                    this.decorations = Decoration.none;
                    return;
                }
                if (update.docChanged || update.selectionSet)
                    this.decorations = highlightCursorBrackets(update.view);
            }
        },
        { decorations: (v) => v.decorations },
    );
