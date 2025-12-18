import type {
    EditorView as EditorViewC,
    ViewUpdate as ViewUpdateC,
    Decoration as DecorationC,
    DecorationSet as DecorationSetC,
    ViewPlugin as ViewPluginC,
} from "@codemirror/view";
import type { Prec as PrecC, Range as RangeC } from "@codemirror/state";
import {
    findMatchingBracket,
    getOpenBracket,
    getCloseBracket,
} from "../utils/editor_utils";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";
import { type Bounds, Context, getEquationBounds } from "src/utils/context";
import {
    getLatexSuiteConfig,
    type LatexSuiteFacet,
} from "src/settings/settings";

const Ncolors = 3;

function getHighlightBracketMark(
    pos: number,
    className: string,
    Decoration: typeof DecorationC,
): RangeC<DecorationC> {
    return Decoration.mark({
        inclusive: true,
        attributes: {},
        class: className,
    }).range(pos, pos + 1);
}

function colorPairedBrackets(
    view: EditorViewC,
    syntaxTree: typeof syntaxTreeC,
    Decoration: typeof DecorationC,
): DecorationSetC {
    const widgets: RangeC<DecorationC>[] = [];

    for (const { from, to } of view.visibleRanges) {
        const math_ranges: Bounds[] = [];
        syntaxTree(view.state).iterate({
            from,
            to,
            enter: (node) => {
                if (node.name !== "Math") {
                    return;
                } else if (
                    math_ranges.length === 0 ||
                    node.to > math_ranges[math_ranges.length - 1].end
                ) {
                    math_ranges.push({ start: node.from, end: node.to });
                }
            },
        });
        for (const bounds of math_ranges) {
            const eqn = view.state.doc.sliceString(bounds.start, bounds.end);

            const openBrackets = ["{", "[", "("];
            const closeBrackets = ["}", "]", ")"];

            const bracketsStack = [];
            const bracketsPosStack = [];

            for (let i = 0; i < eqn.length; i++) {
                const char = eqn.charAt(i);

                if (openBrackets.includes(char)) {
                    bracketsStack.push(char);
                    bracketsPosStack.push(i);
                } else if (closeBrackets.includes(char)) {
                    const lastBracket = bracketsStack[bracketsStack.length - 1];
                    if (getCloseBracket(lastBracket) === char) {
                        bracketsStack.pop();
                        const lastBracketPos = bracketsPosStack.pop();
                        const depth = bracketsStack.length % Ncolors;

                        const className = "latex-suite-color-bracket-" + depth;

                        const j = lastBracketPos + bounds.start;
                        const k = i + bounds.start;

                        widgets.push(
                            getHighlightBracketMark(j, className, Decoration),
                        );
                        widgets.push(
                            getHighlightBracketMark(k, className, Decoration),
                        );
                    }
                }
            }
        }
    }

    return Decoration.set(widgets, true);
}

function getEnclosingBracketsPos(
    view: EditorViewC,
    pos: number,
    syntaxTree: typeof syntaxTreeC,
): { left: number; right: number } | -1 {
    const result = getEquationBounds(view.state, syntaxTree);
    if (!result) return -1;
    const { start, end } = result;
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

function highlightCursorBrackets(
    view: EditorViewC,
    Decoration: typeof DecorationC,
    latexSuiteConfig: LatexSuiteFacet,
    syntaxTree: typeof syntaxTreeC,
) {
    const widgets: RangeC<DecorationC>[] = [];
    const selection = view.state.selection;
    const ranges = selection.ranges;
    const text = view.state.doc.toString();
    const ctx = Context.fromView(view, latexSuiteConfig, syntaxTree);

    if (!ctx.mode.inMath()) {
        return Decoration.none;
    }

    const bounds = ctx.getBounds(syntaxTree, selection.main.to);
    if (!bounds) return Decoration.none;
    const eqn = view.state.doc.sliceString(bounds.start, bounds.end);

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
                i - bounds.start,
                openBracket,
                closeBracket,
                backwards,
            );

            if (j === -1) continue;
            j = j + bounds.start;

            widgets.push(getHighlightBracketMark(i, className, Decoration));
            widgets.push(getHighlightBracketMark(j, className, Decoration));
            done = true;
            break;
        }

        if (done) break;

        // Highlight brackets enclosing the cursor
        if (range.empty) {
            const pos = range.from - 1;

            const result = getEnclosingBracketsPos(view, pos, syntaxTree);
            if (result === -1) continue;

            widgets.push(
                getHighlightBracketMark(result.left, className, Decoration),
            );
            widgets.push(
                getHighlightBracketMark(result.right, className, Decoration),
            );
            done = true;
            break;
        }

        if (done) break;
    }

    return Decoration.set(widgets, true);
}

const colorPairedBracketsPlugin = (
    ViewPlugin: typeof ViewPluginC,
    Decoration: typeof DecorationC,
    syntaxTree: typeof syntaxTreeC,
    latexSuiteConfig: LatexSuiteFacet,
) =>
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSetC;

            constructor(view: EditorViewC) {
                if (
                    !getLatexSuiteConfig(view, latexSuiteConfig)
                        .colorPairedBracketsEnabled
                ) {
                    this.decorations = Decoration.none;
                    return;
                }
                this.decorations = colorPairedBrackets(
                    view,
                    syntaxTree,
                    Decoration,
                );
            }

            update(update: ViewUpdateC) {
                if (
                    !getLatexSuiteConfig(update.view, latexSuiteConfig)
                        .colorPairedBracketsEnabled
                ) {
                    this.decorations = Decoration.none;
                    return;
                }
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = colorPairedBrackets(
                        update.view,
                        syntaxTree,
                        Decoration,
                    );
                }
            }
        },
        { decorations: (v) => v.decorations },
    );

export const colorPairedBracketsPluginLowestPrec = (
    Prec: typeof PrecC,
    ViewPlugin: typeof ViewPluginC,
    Decoration: typeof DecorationC,
    syntaxTree: typeof syntaxTreeC,
    latexSuiteConfig: LatexSuiteFacet,
) =>
    Prec.lowest(
        colorPairedBracketsPlugin(
            ViewPlugin,
            Decoration,
            syntaxTree,
            latexSuiteConfig,
        ).extension,
    );

export const highlightCursorBracketsPlugin = (
    ViewPlugin: typeof ViewPluginC,
    Decoration: typeof DecorationC,
    latexSuiteConfig: LatexSuiteFacet,
    syntaxTree: typeof syntaxTreeC,
) =>
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSetC;

            constructor(view: EditorViewC) {
                if (
                    !getLatexSuiteConfig(view, latexSuiteConfig)
                        .highlightCursorBracketsEnabled
                ) {
                    this.decorations = Decoration.none;
                    return;
                }
                this.decorations = highlightCursorBrackets(
                    view,
                    Decoration,
                    latexSuiteConfig,
                    syntaxTree,
                );
            }

            update(update: ViewUpdateC) {
                if (
                    !getLatexSuiteConfig(update.view, latexSuiteConfig)
                        .highlightCursorBracketsEnabled
                ) {
                    this.decorations = Decoration.none;
                    return;
                }
                if (update.docChanged || update.selectionSet)
                    this.decorations = highlightCursorBrackets(
                        update.view,
                        Decoration,
                        latexSuiteConfig,
                        syntaxTree,
                    );
            }
        },
        { decorations: (v) => v.decorations },
    );
