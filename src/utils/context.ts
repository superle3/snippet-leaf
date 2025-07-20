import type {
    EditorState as EditorStateC,
    SelectionRange as SelectionRangeC,
} from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { findMatchingBracket, getCloseBracket } from "./editor_utils";
import { Mode } from "../snippets/options";
import type { Environment } from "../snippets/environment";
import type { LatexSuiteFacet } from "../snippets/codemirror/config";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";
import type { SyntaxNode, Tree, NodeIterator } from "@lezer/common";

export interface Bounds {
    start: number;
    end: number;
}

export class Context {
    state: EditorStateC;
    mode!: Mode;
    pos: number;
    ranges: SelectionRangeC[];
    codeblockLanguage: string;
    boundsCache: Map<number, EquationInfo>;

    static fromState(
        state: EditorStateC,
        latexSuiteConfig: LatexSuiteFacet,
        syntaxTree: typeof syntaxTreeC
    ): Context {
        const ctx = new Context();
        const sel = state.selection;
        ctx.state = state;
        ctx.pos = sel.main.to;
        ctx.ranges = Array.from(sel.ranges).reverse(); // Last to first
        ctx.mode = new Mode();
        ctx.boundsCache = new Map();

        const mathMode = equationType(state, syntaxTree);

        if (mathMode) {
            ctx.mode.textEnv = MathMode.TextEnv === mathMode.type;
            ctx.mode.bracketBlockMath =
                mathMode.type === MathMode.BracketDisplay;
            ctx.mode.dollarBlockMath = mathMode.type === MathMode.DollarDisplay;
            ctx.mode.dollarInlineMath = mathMode.type === MathMode.DollarInline;
            ctx.mode.parenInlineMath = mathMode.type === MathMode.ParenInline;
            ctx.mode.text = false;
            ctx.boundsCache.set(ctx.pos, mathMode);
        } else {
            ctx.mode.text = true;
        }

        const mode_hashmap: Record<string, string> = {
            default: "text",
            [MathMode.DollarInline]: "inlineMath",
            [MathMode.DollarDisplay]: "blockMath",
            [MathMode.ParenInline]: "parenInline",
            [MathMode.BracketDisplay]: "bracketDisplay",
            [MathMode.Array]: "arrayMath",
        };
        console.log("mode_hashmap:", mode_hashmap[mathMode?.type ?? "default"]);
        return ctx;
    }

    static fromView(
        view: EditorView,
        latexSuiteConfig: LatexSuiteFacet,
        syntaxTree: typeof syntaxTreeC
    ): Context {
        return Context.fromState(view.state, latexSuiteConfig, syntaxTree);
    }

    isWithinEnvironment(
        pos: number,
        env: Environment,
        syntaxTree: typeof syntaxTreeC
    ): boolean {
        if (!this.mode.inMath()) return false;

        const bounds = this.getBounds(syntaxTree);
        if (!bounds) return;

        const { start, end } = bounds;
        const text = this.state.sliceDoc(start, end);
        // pos referred to the absolute position in the whole document, but we just sliced the text
        // so now pos must be relative to the start in order to be any useful
        pos -= start;

        const openBracket = env.openSymbol.slice(-1);
        const closeBracket = getCloseBracket(openBracket);

        // Take care when the open symbol ends with a bracket {, [, or (
        // as then the closing symbol, }, ] or ), is not unique to this open symbol
        let offset;
        let openSearchSymbol;

        if (
            ["{", "[", "("].includes(openBracket) &&
            env.closeSymbol === closeBracket
        ) {
            offset = env.openSymbol.length - 1;
            openSearchSymbol = openBracket;
        } else {
            offset = 0;
            openSearchSymbol = env.openSymbol;
        }

        let left = text.lastIndexOf(env.openSymbol, pos - 1);

        while (left != -1) {
            const right = findMatchingBracket(
                text,
                left + offset,
                openSearchSymbol,
                env.closeSymbol,
                false
            );

            if (right === -1) return false;

            // Check whether the cursor lies inside the environment symbols
            if (right >= pos && pos >= left + env.openSymbol.length) {
                return true;
            }

            if (left <= 0) return false;

            // Find the next open symbol
            left = text.lastIndexOf(env.openSymbol, left - 1);
        }

        return false;
    }

    inTextEnvironment(syntaxTree: typeof syntaxTreeC): boolean {
        return (
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\text{",
                    closeSymbol: "}",
                },
                syntaxTree
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\tag{",
                    closeSymbol: "}",
                },
                syntaxTree
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\begin{",
                    closeSymbol: "}",
                },
                syntaxTree
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\end{",
                    closeSymbol: "}",
                },
                syntaxTree
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\mathrm{",
                    closeSymbol: "}",
                },
                syntaxTree
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\color{",
                    closeSymbol: "}",
                },
                syntaxTree
            )
        );
    }

    getBounds(syntaxTree: typeof syntaxTreeC, pos: number = this.pos): Bounds {
        // yes, I also want the cache to work over the produced range instead of just that one through
        // a BTree or the like, but that'd be probably overkill
        if (this.boundsCache.has(pos)) {
            return this.boundsCache.get(pos).bounds;
        }

        const mathMode = equationType(this.state, syntaxTree);
        const bounds = mathMode?.bounds;

        this.boundsCache.set(pos, mathMode);
        return bounds;
    }
    getOuterBounds(
        syntaxTree: typeof syntaxTreeC,
        pos: number = this.pos
    ): Bounds {
        const mathMode = this.boundsCache.has(pos)
            ? this.boundsCache.get(pos)
            : equationType(this.state, syntaxTree);
        if (!mathMode) return;
        const offSets = {
            [MathMode.BracketDisplay]: BracketMathOffset,
            [MathMode.DollarDisplay]: DisplayMathOffset,
            [MathMode.ParenInline]: ParenMathOffset,
            [MathMode.DollarInline]: InlineMathOffset,
            [MathMode.Array]: ArrayMathOffset,
            [MathMode.TextEnv]: TextEnvOffset,
        };
        return {
            start: mathMode.bounds.start - offSets[mathMode.type].start,
            end: mathMode.bounds.end - offSets[mathMode.type].end,
        };
    }

    // Accounts for equations within text environments, e.g. $$\text{... $...$}$$
    getInnerBounds(
        syntaxTree: typeof syntaxTreeC,
        pos: number = this.pos
    ): Bounds {
        const bounds = getInnerEquationBounds(this.state, syntaxTree);
        return bounds;
    }
}

export enum MathMode {
    DollarInline,
    DollarDisplay,
    ParenInline,
    BracketDisplay,
    Array,
    TextEnv,
}

const DisplayMathOffset: Bounds = {
    start: 1,
    end: -1,
};
const BracketMathOffset: Bounds = {
    start: 2,
    end: -2,
};
const InlineMathOffset: Bounds = {
    start: 0,
    end: -1,
};
const ParenMathOffset: Bounds = {
    start: 2,
    end: -2,
};

// TODO: implement this properly somehow
const ArrayMathOffset: Bounds = {
    start: 0,
    end: 0,
};
// TODO: implement this properly somehow
const TextEnvOffset: Bounds = {
    start: 0,
    end: 0,
};

type EquationInfo = {
    type: MathMode;
    bounds: Bounds;
} | null;

const equationType = (
    state: EditorStateC,
    syntaxTree: typeof syntaxTreeC,
    direction: 1 | -1 = 1,
    iterations: number = 0
): EquationInfo => {
    const pos = state.selection.main.to;
    const tree: Tree = syntaxTree(state);

    // Traverse up the tree to find math context
    let currentNode: NodeIterator = tree.resolveStack(pos, direction);
    let type: MathMode;
    let bounds: Bounds;
    let offset: Bounds;
    while (currentNode) {
        if (currentNode.node.name === "InlineMath") {
            type = MathMode.DollarInline;
            bounds = boundsFromNode(currentNode.node);
            offset = InlineMathOffset;
            break;
        } else if (currentNode.node.name === "ParenMath") {
            type = MathMode.ParenInline;
            bounds = boundsFromNode(currentNode.node);
            offset = ParenMathOffset;
            break;
        } else if (currentNode.node.name === "BracketMath") {
            type = MathMode.BracketDisplay;
            bounds = boundsFromNode(currentNode.node);
            offset = BracketMathOffset;
            break;
        } else if (currentNode.node.name === "DisplayMath") {
            if (pos === currentNode.node.from || pos === currentNode.node.to) {
                return null;
            }
            type = MathMode.DollarDisplay;
            bounds = boundsFromNode(currentNode.node);
            offset = DisplayMathOffset;
            break;
        } else if (currentNode.node.name === "ArrayMath") {
            type = MathMode.Array;
            bounds = boundsFromNode(currentNode.node);
            offset = ArrayMathOffset;
            break;
        } else if (currentNode.node.name === "DollarMath") {
            if (currentNode.node.to - currentNode.node.from < 4) {
                type = MathMode.DollarInline;
                bounds = boundsFromNode(currentNode.node);
                offset = InlineMathOffset;
                break;
            }
            return equationType(
                state,
                syntaxTree,
                -direction as 1 | -1,
                iterations
            );
        } else if (currentNode.node.name === "TextArgument") {
            type = MathMode.TextEnv;
            bounds = boundsFromNode(currentNode.node);
            offset = TextEnvOffset;
            break;
        }
        iterations++;
        currentNode = currentNode.next;
    }
    if (type) {
        return {
            type,
            bounds: addBounds(bounds, offset),
        };
    }

    return null;
};

const addBounds = (...bounds: Bounds[]) => {
    if (bounds.length === 0) return null;

    return bounds.reduce((acc, bound) => {
        if (!acc) return bound;
        return {
            start: acc.start + bound.start,
            end: acc.end + bound.end,
        };
    });
};

/**
 * Figures out where this equation starts and where it ends.
 *
 * **Note:** If you intend to use this directly, check out Context.getBounds instead, which caches and also takes care of codeblock languages which should behave like math mode.
 */
export const getEquationBounds = (
    state: EditorStateC,
    syntaxTree: typeof syntaxTreeC,
    pos?: number
): Bounds | null => {
    if (!pos) pos = state.selection.main.to;
    return equationType(state, syntaxTree)?.bounds ?? null;
};

// Accounts for equations within text environments, e.g. $$\text{... $...$}$$
const getInnerEquationBounds = (
    state: EditorStateC,
    syntaxTree: typeof syntaxTreeC,
    pos?: number
): Bounds => {
    if (!pos) pos = state.selection.main.to;
    return equationType(state, syntaxTree, 1, 0)?.bounds;
};

const boundsFromNode = (node: SyntaxNode): Bounds | null => {
    const start = node.from;
    const end = node.to;

    return { start, end };
};
