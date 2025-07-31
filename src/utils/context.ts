import type {
    EditorState as EditorStateC,
    SelectionRange as SelectionRangeC,
} from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { findMatchingBracket, getCloseBracket } from "./editor_utils";
import { Mode } from "../snippets/options";
import type { Environment } from "../snippets/environment";
import type { LatexSuiteFacet } from "src/settings/settings";
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
        syntaxTree: typeof syntaxTreeC,
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
            ctx.mode.equation = MathMode.Equation === mathMode.type;
            ctx.mode.array = MathMode.Array === mathMode.type;
            ctx.mode.text = false;
            ctx.boundsCache.set(ctx.pos, mathMode);
        } else {
            ctx.mode.text = true;
        }

        return ctx;
    }

    static fromView(
        view: EditorView,
        latexSuiteConfig: LatexSuiteFacet,
        syntaxTree: typeof syntaxTreeC,
    ): Context {
        return Context.fromState(view.state, latexSuiteConfig, syntaxTree);
    }

    isWithinEnvironment(
        pos: number,
        env: Environment,
        syntaxTree: typeof syntaxTreeC,
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
                false,
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
                syntaxTree,
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\tag{",
                    closeSymbol: "}",
                },
                syntaxTree,
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\begin{",
                    closeSymbol: "}",
                },
                syntaxTree,
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\end{",
                    closeSymbol: "}",
                },
                syntaxTree,
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\mathrm{",
                    closeSymbol: "}",
                },
                syntaxTree,
            ) ||
            this.isWithinEnvironment(
                this.pos,
                {
                    openSymbol: "\\color{",
                    closeSymbol: "}",
                },
                syntaxTree,
            )
        );
    }

    getBounds(syntaxTree: typeof syntaxTreeC, pos: number = this.pos): Bounds {
        // yes, I also want the cache to work over the produced range instead of just that one through
        // a BTree or the like, but that'd be probably overkill
        if (this.boundsCache.has(pos)) {
            return this.boundsCache.get(pos).inner_bounds;
        }

        const mathMode = equationType(this.state, syntaxTree, pos);
        const bounds = mathMode?.inner_bounds;

        this.boundsCache.set(pos, mathMode);
        return bounds;
    }
    getOuterBounds(
        syntaxTree: typeof syntaxTreeC,
        pos: number = this.pos,
    ): Bounds {
        const mathMode = this.boundsCache.has(pos)
            ? this.boundsCache.get(pos)
            : equationType(this.state, syntaxTree, pos);
        if (!mathMode) return;
        return mathMode.outer_bounds;
    }

    // Accounts for equations within text environments, e.g. $$\text{... $...$}$$
    getInnerBounds(
        syntaxTree: typeof syntaxTreeC,
        pos: number = this.pos,
    ): Bounds {
        const bounds = getInnerEquationBounds(this.state, syntaxTree, pos);
        return bounds;
    }

    getEnvironmentName(
        syntaxTree: typeof syntaxTreeC,
        pos: number = this.pos,
    ): string | null {
        const mathMode = this.boundsCache.has(pos)
            ? this.boundsCache.get(pos)
            : equationType(this.state, syntaxTree, pos);
        if (!mathMode || !("EnvName" in mathMode)) return null;
        return mathMode.EnvName;
    }
}

export enum MathMode {
    DollarInline,
    DollarDisplay,
    ParenInline,
    BracketDisplay,
    Equation,
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
const TextEnvOffset: Bounds = {
    start: 0,
    end: 0,
};

type EquationInfo =
    | {
          type: Exclude<MathMode, MathMode.Equation | MathMode.Array>;
          inner_bounds: Bounds;
          outer_bounds: Bounds;
      }
    | {
          type: MathMode.Equation | MathMode.Array;
          inner_bounds: Bounds;
          outer_bounds: Bounds;
          EnvName: string;
      }
    | null;

const mathContext: Record<
    string,
    (node: SyntaxNode, state?: EditorStateC) => EquationInfo | false
> = {
    InlineMath: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.DollarInline,
        inner_bounds: addBounds(boundsFromNode(node), InlineMathOffset),
        outer_bounds: boundsFromNode(node),
    }),
    ParenMath: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.ParenInline,
        inner_bounds: addBounds(boundsFromNode(node), ParenMathOffset),
        outer_bounds: boundsFromNode(node),
    }),
    BracketMath: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.BracketDisplay,
        inner_bounds: addBounds(boundsFromNode(node), BracketMathOffset),
        outer_bounds: boundsFromNode(node),
    }),
    DisplayMath: (node: SyntaxNode): EquationInfo => {
        return {
            type: MathMode.DollarDisplay,
            inner_bounds: addBounds(boundsFromNode(node), DisplayMathOffset),
            outer_bounds: boundsFromNode(node),
        };
    },
    /**
     * Handles the special case where the grammar returns displaymath for `$|$` when that should be inline math.
     * @param node the node to check
     * @returns inline math bounds or null if its not the special case.
     */
    DollarMath: (node: SyntaxNode): EquationInfo => {
        if (node.to - node.from < 4) {
            return {
                type: MathMode.DollarInline,
                inner_bounds: addBounds(boundsFromNode(node), InlineMathOffset),
                outer_bounds: boundsFromNode(node),
            };
        }
        return null;
    },
    TextArgument: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.TextEnv,
        inner_bounds: addBounds(boundsFromNode(node), TextEnvOffset),
        outer_bounds: boundsFromNode(node),
    }),
    EquationEnvironment: (
        node: SyntaxNode & { name: "EquationEnvironment" },
        state: EditorStateC,
    ) => {
        const { EnvName, inner_bounds } = getInnerBoundsFromEquation(
            node,
            state,
        );
        if (!inner_bounds) {
            console.warn("No bounds found for EquationEnvironment");
            return false;
        }
        return {
            type: MathMode.Equation,
            inner_bounds,
            outer_bounds: boundsFromNode(node),
            EnvName,
        };
    },
    EquationArrayEnvironment: (
        node: SyntaxNode & { name: "EquationArrayEnvironment" },
        state: EditorStateC,
    ) => {
        const { EnvName, inner_bounds } = getInnerBoundsFromEquation(
            node,
            state,
        );
        if (!inner_bounds) {
            console.warn(
                "No bounds found for EquationArrayEnvironment",
                EnvName,
                inner_bounds,
            );
            return false;
        }
        return {
            type: MathMode.Array,
            inner_bounds,
            outer_bounds: boundsFromNode(node),
            EnvName,
        };
    },
} as const;
const equationType = (
    state: EditorStateC,
    syntaxTree: typeof syntaxTreeC,
    pos: number = state.selection.main.to,
    direction: 1 | -1 = 1,
): EquationInfo => {
    const tree: Tree = syntaxTree(state);

    // Traverse up the tree to find math context
    let currentNode: NodeIterator = tree.resolveStack(pos, direction);
    while (currentNode) {
        const context = mathContext[currentNode.node.name];
        if (context !== undefined) {
            const result = context(currentNode.node, state);
            if (result !== false) {
                return result;
            }
        }
        currentNode = currentNode.next;
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

const getInnerBoundsFromEquation = (
    node: SyntaxNode & {
        name: "EquationEnvironment" | "EquationArrayEnvironment";
    },
    state: EditorStateC,
): { EnvName: string; inner_bounds: Bounds } | null => {
    const hash_map: Record<string, string> = {
        EquationEnvironment: "EquationEnvName",
        EquationArrayEnvironment: "EquationArrayEnvName",
    };
    const equation_name_node = node
        .getChild("EndEnv")
        .getChild("EnvNameGroup")
        ?.getChild(hash_map[node.name]);
    const content = node.getChild("Content");
    if (!content || !equation_name_node) {
        console.warn(
            `No content or equation name found for ${node.name} at position ${node.from}-${node.to}`,
            content,
            equation_name_node,
        );
        return null;
    }
    return {
        EnvName: state.sliceDoc(equation_name_node.from, equation_name_node.to),
        inner_bounds: boundsFromNode(content),
    };
};

/**
 * Figures out where this equation starts and where it ends.
 *
 * **Note:** If you intend to use this directly, check out Context.getBounds instead, which caches and also takes care of codeblock languages which should behave like math mode.
 */
export const getEquationBounds = (
    state: EditorStateC,
    syntaxTree: typeof syntaxTreeC,
    pos?: number,
): Bounds | null => {
    if (!pos) pos = state.selection.main.to;
    return equationType(state, syntaxTree)?.inner_bounds ?? null;
};

// Accounts for equations within text environments, e.g. $$\text{... $...$}$$
const getInnerEquationBounds = (
    state: EditorStateC,
    syntaxTree: typeof syntaxTreeC,
    pos?: number,
): Bounds => {
    if (!pos) pos = state.selection.main.to;
    return equationType(state, syntaxTree, pos, 1)?.inner_bounds;
};

const boundsFromNode = (node: SyntaxNode): Bounds | null => {
    const start = node.from;
    const end = node.to;

    return { start, end };
};
