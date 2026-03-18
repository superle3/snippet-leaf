import type { EditorState, SelectionRange } from "@codemirror/state";
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import { findMatchingBracket, getCloseBracket } from "../utils/editor_utils";
import { Mode } from "../snippets/options";
import type { Environment } from "../snippets/environment";
import type { SyntaxNode, Tree, NodeIterator } from "@lezer/common";
import type { FullBounds } from "./mathbounds";
import { syntaxTree } from "@codemirror/language";

export interface Bounds {
    start: number;
    end: number;
}
export class Context {
    view: EditorView;
    state: EditorState;
    mode!: Mode;
    pos: number;
    ranges: SelectionRange[];
    boundsCache: Map<number, EquationInfo>;
    innerBoundsCache: Map<number, Bounds>;
    constructor(view: EditorView) {
        this.updateFromView(view);
    }
    update(update: ViewUpdate) {
        if (
            update.docChanged ||
            update.selectionSet ||
            update.viewportChanged
        ) {
            this.updateFromView(update.view);
        }
    }
    updateFromView(view: EditorView) {
        this.view = view;
        this.state = view.state;
        const sel = view.state.selection;
        this.state = view.state;
        this.pos = sel.main.to;
        this.ranges = Array.from(sel.ranges).reverse(); // Last to first
        this.mode = new Mode();
        this.boundsCache = new Map();

        const mathMode = equationType(this.state);

        if (mathMode) {
            this.mode.textEnv = MathMode.TextEnv === mathMode.type;
            this.mode.bracketBlockMath =
                mathMode.type === MathMode.BracketDisplay;
            this.mode.dollarBlockMath =
                mathMode.type === MathMode.DollarDisplay;
            this.mode.dollarInlineMath =
                mathMode.type === MathMode.DollarInline;
            this.mode.parenInlineMath = mathMode.type === MathMode.ParenInline;
            this.mode.equation = MathMode.Equation === mathMode.type;
            this.mode.array = MathMode.Array === mathMode.type;
            this.mode.text = false;
            this.boundsCache.set(this.pos, mathMode);
        } else {
            this.mode.text = true;
        }
    }

    isWithinEnvironment(pos: number, env: Environment): boolean {
        if (!this.mode.inMath()) return false;

        const bounds = this.getBounds();
        if (!bounds) return;

        const { inner_start: start, inner_end: end } = bounds;
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

    inTextEnvironment(): boolean {
        return (
            this.isWithinEnvironment(this.pos, {
                openSymbol: "\\text{",
                closeSymbol: "}",
            }) ||
            this.isWithinEnvironment(this.pos, {
                openSymbol: "\\tag{",
                closeSymbol: "}",
            }) ||
            this.isWithinEnvironment(this.pos, {
                openSymbol: "\\begin{",
                closeSymbol: "}",
            }) ||
            this.isWithinEnvironment(this.pos, {
                openSymbol: "\\end{",
                closeSymbol: "}",
            }) ||
            this.isWithinEnvironment(this.pos, {
                openSymbol: "\\mathrm{",
                closeSymbol: "}",
            }) ||
            this.isWithinEnvironment(this.pos, {
                openSymbol: "\\color{",
                closeSymbol: "}",
            })
        );
    }

    getBounds(pos: number = this.pos): FullBounds {
        // yes, I also want the cache to work over the produced range instead of just that one through
        // a BTree or the like, but that'd be probably overkill
        if (this.boundsCache.has(pos)) {
            return this.boundsCache.get(pos);
        }

        const mathMode = equationType(this.state, pos);

        this.boundsCache.set(pos, mathMode);
        return mathMode;
    }

    // Accounts for equations within text environments, e.g. $$\text{... $...$}$$
    getInnerBounds(pos: number = this.pos): FullBounds {
        const bounds = getInnerEquationBounds(this.state, pos);
        return bounds;
    }

    getEnvironmentName(pos: number = this.pos): string | null {
        const mathMode = this.boundsCache.has(pos)
            ? this.boundsCache.get(pos)
            : equationType(this.state, pos);
        if (!mathMode || !("EnvName" in mathMode)) return null;
        return mathMode.EnvName;
    }
}
export let contextPlugin: ViewPlugin<Context>;
export const createContextPlugin = () => {
    contextPlugin = ViewPlugin.fromClass(Context);
    return contextPlugin;
};

export const getContextPlugin = (view: EditorView) => {
    const plugin = view.plugin(contextPlugin);
    if (!plugin) {
        throw new Error(
            "Context plugin not found, something went wrong with the plugin initialization",
        );
    }
    return plugin;
};

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

export type EquationInfo =
    | ((
          | {
                type: Exclude<MathMode, MathMode.Equation | MathMode.Array>;
            }
          | {
                type: MathMode.Equation | MathMode.Array;
                EnvName: string;
            }
      ) &
          FullBounds)
    | null;

export const mathContext: Record<
    string,
    (node: SyntaxNode, state?: EditorState) => EquationInfo | false
> = {
    InlineMath: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.DollarInline,
        ...boundsFromOffset(node, InlineMathOffset),
    }),
    ParenMath: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.ParenInline,
        ...boundsFromOffset(node, ParenMathOffset),
    }),
    BracketMath: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.BracketDisplay,
        ...boundsFromOffset(node, BracketMathOffset),
    }),
    DisplayMath: (node: SyntaxNode): EquationInfo => {
        return {
            type: MathMode.DollarDisplay,
            inner_start: node.from + 1,
            inner_end: node.to - 1,
            outer_start: node.from - 1,
            outer_end: node.to + 1,
        };
    },
    /**
     * Handles the special case where the grammar returns displaymath for `$|$` when that should be inline math.
     * @param node the node to check
     * @returns inline math bounds or null if its not the special case.
     */
    DollarMath: (node: SyntaxNode, state: EditorState): EquationInfo => {
        if (node.to - node.from < 4) {
            return mathContext.InlineMath(node, state) as EquationInfo;
        }
        const mathNode = node.firstChild.nextSibling;
        return mathContext[mathNode.name](mathNode) as EquationInfo;
    },
    BeginEnv: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.TextEnv,
        ...boundsFromOffset(node, TextEnvOffset),
    }),
    EndEnv: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.TextEnv,
        ...boundsFromOffset(node, TextEnvOffset),
    }),
    TextArgument: (node: SyntaxNode): EquationInfo => ({
        type: MathMode.TextEnv,
        ...boundsFromOffset(node, TextEnvOffset),
    }),
    EquationEnvironment: (
        node: SyntaxNode & { name: "EquationEnvironment" },
        state: EditorState,
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
            inner_start: inner_bounds.start,
            inner_end: inner_bounds.end,
            outer_start: node.from,
            outer_end: node.to,
            EnvName,
        };
    },
    EquationArrayEnvironment: (
        node: SyntaxNode & { name: "EquationArrayEnvironment" },
        state: EditorState,
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
            inner_start: inner_bounds.start,
            inner_end: inner_bounds.end,
            outer_start: node.from,
            outer_end: node.to,
            EnvName,
        };
    },
} as const;
const equationType = (
    state: EditorState,
    pos: number = state.selection.main.to,
): EquationInfo => {
    const tree: Tree = syntaxTree(state);

    // Traverse up the tree to find math context
    let currentNode: NodeIterator = tree.resolveStack(pos, 0);
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

const boundsFromOffset = (a: SyntaxNode, offset: Bounds): FullBounds => {
    return {
        inner_start: a.from + offset.start,
        inner_end: a.to + offset.end,
        outer_start: a.from,
        outer_end: a.to,
    };
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
    state: EditorState,
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
    state: EditorState,
    pos?: number,
): FullBounds | null => {
    if (!pos) pos = state.selection.main.to;
    return equationType(state) ?? null;
};

// Accounts for equations within text environments, e.g. $$\text{... $...$}$$
const getInnerEquationBounds = (
    state: EditorState,
    pos?: number,
): FullBounds => {
    if (!pos) pos = state.selection.main.to;
    return equationType(state, pos) ?? null;
};

const boundsFromNode = (node: SyntaxNode): Bounds | null => {
    const start = node.from;
    const end = node.to;

    return { start, end };
};

const printSyntaxTree = (state: EditorState, pos: number) => {
    console.log("Syntax tree at position", pos);
    const tree = syntaxTree(state);
    const i = 0;
    const buildTreeString = (node: SyntaxNode, indent: number = 0): string => {
        let str =
            " ".repeat(indent) +
            node.name +
            ` (${node.from}-${node.to}): ` +
            // `${JSON.stringify([state.sliceDoc(node.from, node.to)])}` +
            "\n";
        // console.log(i++, " i++", [str]);
        let child = node.firstChild;
        while (child) {
            str += buildTreeString(child, indent + 2);
            child = child.nextSibling;
        }
        return str;
    };
    console.log(buildTreeString(tree.topNode));
};
