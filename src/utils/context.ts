import type { EditorState, SelectionRange } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import {
    Direction,
    escalateToToken,
    findMatchingBracket,
    getCharacterAtPos,
    getCloseBracket,
} from "./editor_utils";
import { Mode } from "../snippets/options";
import type { Environment } from "../snippets/environment";
import type { LatexSuiteFacet } from "../snippets/codemirror/config";
import { getLatexSuiteConfig } from "../snippets/codemirror/config";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";

export interface Bounds {
    start: number;
    end: number;
}

export class Context {
    state: EditorState;
    mode!: Mode;
    pos: number;
    ranges: SelectionRange[];
    codeblockLanguage: string;
    boundsCache: Map<number, Bounds>;

    static fromState(
        state: EditorState,
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

        const codeblockLanguage = langIfWithinCodeblock(state, syntaxTree);
        const inCode = codeblockLanguage !== null;

        const settings = getLatexSuiteConfig(state, latexSuiteConfig);
        const forceMath =
            settings.forceMathLanguages.includes(codeblockLanguage);
        ctx.mode.codeMath = forceMath;
        ctx.mode.code = inCode && !forceMath;
        if (ctx.mode.code) ctx.codeblockLanguage = codeblockLanguage;

        // first, check if math mode should be "generally" on
        const inMath = forceMath || isWithinEquation(state, syntaxTree);

        if (inMath && !forceMath) {
            const inInlineEquation = isWithinInlineEquation(state, syntaxTree);

            ctx.mode.blockMath = !inInlineEquation;
            ctx.mode.inlineMath = inInlineEquation;
        }

        if (inMath) {
            ctx.mode.textEnv = ctx.inTextEnvironment(syntaxTree);
        }

        ctx.mode.text = !inCode && !inMath;

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

        const bounds = this.getInnerBounds(syntaxTree);
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
            return this.boundsCache.get(pos);
        }

        let bounds;
        if (this.mode.codeMath) {
            // means a codeblock language triggered the math mode -> use the codeblock bounds instead
            bounds = getCodeblockBounds(this.state, pos, syntaxTree);
        } else {
            bounds = getEquationBounds(this.state, syntaxTree);
        }

        this.boundsCache.set(pos, bounds);
        return bounds;
    }

    // Accounts for equations within text environments, e.g. $$\text{... $...$}$$
    getInnerBounds(
        syntaxTree: typeof syntaxTreeC,
        pos: number = this.pos
    ): Bounds {
        let bounds;
        if (this.mode.codeMath) {
            // means a codeblock language triggered the math mode -> use the codeblock bounds instead
            bounds = getCodeblockBounds(this.state, pos, syntaxTree);
        } else {
            bounds = getInnerEquationBounds(this.state);
        }

        return bounds;
    }
}

// Add this helper function
function printSyntaxTree(tree: any, depth = 0): void {
    const indent = "  ".repeat(depth);
    console.log(`${indent}${tree.name} (${tree.from}-${tree.to})`);

    // If it has children, recursively print them
    if (tree.firstChild) {
        let child = tree.firstChild;
        do {
            printSyntaxTree(child, depth + 1);
        } while ((child = child.nextSibling));
    }
}

const isWithinEquation = (
    state: EditorState,
    syntaxTree: typeof syntaxTreeC
): boolean => {
    const pos = state.selection.main.to;
    const tree = syntaxTree(state);

    // Print the whole syntax tree
    console.log("=== SYNTAX TREE ===");
    printSyntaxTree(tree.topNode);
    console.log("=== END TREE ===");
    console.log("pos:", pos);

    let syntaxNode = tree.resolveInner(pos, -1);
    console.log("syntaxNode", syntaxNode.name);

    // Traverse up the tree to find math context
    let currentNode = syntaxNode;
    while (currentNode) {
        console.log("checking node:", currentNode.name);

        // Check for any math-related nodes
        if (
            currentNode.name === "InlineMath" ||
            currentNode.name === "DisplayMath" ||
            currentNode.name === "DollarMath" ||
            currentNode.name === "Math"
        ) {
            console.log(currentNode.name);
            return true;
        }

        currentNode = currentNode.parent;
    }

    // Fallback: try different resolve modes if no parent found
    if (!syntaxNode.parent) {
        syntaxNode = tree.resolveInner(pos, 1);
        console.log("fallback syntaxNode:", syntaxNode.name);

        currentNode = syntaxNode;
        while (currentNode) {
            if (
                currentNode.name === "InlineMath" ||
                currentNode.name === "DisplayMath" ||
                currentNode.name === "DollarMath" ||
                currentNode.name === "Math"
            ) {
                console.log(currentNode.name);
                return true;
            }
            currentNode = currentNode.parent;
        }
    }
    console.log("not in equation");
    return false;
};

const isWithinInlineEquation = (
    state: EditorState,
    syntaxTree: typeof syntaxTreeC
): boolean => {
    const pos = state.selection.main.to;
    const tree = syntaxTree(state);

    let syntaxNode = tree.resolveInner(pos, -1);
    console.log("isWithinInlineEquation - syntaxNode:", syntaxNode.name);

    // Traverse up the tree to find math context
    let currentNode = syntaxNode;
    while (currentNode) {
        console.log("checking node for inline:", currentNode.name);

        // If we find InlineMath, we're in inline equation
        if (currentNode.name === "InlineMath") {
            return true;
        }

        // If we find DisplayMath, we're in display equation (not inline)
        if (currentNode.name === "DisplayMath") {
            return false;
        }

        // If we find DollarMath, check if its child is InlineMath or DisplayMath
        if (currentNode.name === "DollarMath") {
            let child = currentNode.firstChild;
            while (child) {
                if (child.name === "InlineMath") {
                    return true;
                }
                if (child.name === "DisplayMath") {
                    return false;
                }
                child = child.nextSibling;
            }
        }

        currentNode = currentNode.parent;
    }

    // Fallback: try different resolve modes if no parent found
    if (!syntaxNode.parent) {
        syntaxNode = tree.resolveInner(pos, 1);
        console.log("fallback syntaxNode:", syntaxNode.name);

        currentNode = syntaxNode;
        while (currentNode) {
            if (currentNode.name === "InlineMath") {
                return true;
            }
            if (currentNode.name === "DisplayMath") {
                return false;
            }
            if (currentNode.name === "DollarMath") {
                let child = currentNode.firstChild;
                while (child) {
                    if (child.name === "InlineMath") {
                        return true;
                    }
                    if (child.name === "DisplayMath") {
                        return false;
                    }
                    child = child.nextSibling;
                }
            }
            currentNode = currentNode.parent;
        }
    }

    return false;
};

/**
 * Figures out where this equation starts and where it ends.
 *
 * **Note:** If you intend to use this directly, check out Context.getBounds instead, which caches and also takes care of codeblock languages which should behave like math mode.
 */
export const getEquationBounds = (
    state: EditorState,
    syntaxTree: typeof syntaxTreeC,
    pos?: number
): Bounds => {
    if (!pos) pos = state.selection.main.to;
    const tree = syntaxTree(state);

    let syntaxNode = tree.resolveInner(pos, -1);

    if (!syntaxNode.parent) {
        syntaxNode = tree.resolveInner(pos, 1);
    }

    // Account/allow for being on an empty line in a equation
    if (!syntaxNode.parent) syntaxNode = tree.resolveInner(pos - 1, -1);

    const cursor = syntaxNode.cursor();
    const begin = escalateToToken(cursor, Direction.Backward, "math-begin");
    const end = escalateToToken(cursor, Direction.Forward, "math-end");

    if (begin && end) {
        return { start: begin.to, end: end.from };
    } else {
        return null;
    }
};

// Accounts for equations within text environments, e.g. $$\text{... $...$}$$
const getInnerEquationBounds = (state: EditorState, pos?: number): Bounds => {
    if (!pos) pos = state.selection.main.to;
    let text = state.doc.toString();

    // ignore \$
    text = text.replaceAll("\\$", "\\R");

    const left = text.lastIndexOf("$", pos - 1);
    const right = text.indexOf("$", pos);

    if (left === -1 || right === -1) return null;

    return { start: left + 1, end: right };
};

/**
 * Figures out where this codeblock starts and where it ends.
 *
 * **Note:** If you intend to use this directly, check out Context.getBounds instead, which caches and also takes care of codeblock languages which should behave like math mode.
 */
const getCodeblockBounds = (
    state: EditorState,
    pos: number = state.selection.main.from,
    syntaxTree: typeof syntaxTreeC
): Bounds => {
    const tree = syntaxTree(state);

    let cursor = tree.cursorAt(pos, -1);
    const blockBegin = escalateToToken(
        cursor,
        Direction.Backward,
        "HyperMD-codeblock-begin"
    );

    cursor = tree.cursorAt(pos, -1);
    const blockEnd = escalateToToken(
        cursor,
        Direction.Forward,
        "HyperMD-codeblock-end"
    );

    return { start: blockBegin.to + 1, end: blockEnd.from - 1 };
};

const langIfWithinCodeblock = (
    state: EditorState,
    syntaxTree: typeof syntaxTreeC
): string | null => {
    const tree = syntaxTree(state);

    const pos = state.selection.ranges[0].from;

    /*
     * get a tree cursor at the position
     *
     * A newline does not belong to any syntax nodes except for the Document,
     * which corresponds to the whole document. So, we change the `mode` of the
     * `cursorAt` depending on whether the character just before the cursor is a
     * newline.
     */
    const cursor =
        pos === 0 || getCharacterAtPos(state, pos - 1) === "\n"
            ? tree.cursorAt(pos, 1)
            : tree.cursorAt(pos, -1);

    // check if we're in a codeblock atm at all
    const inCodeblock = cursor.name.includes("codeblock");
    if (!inCodeblock) {
        return null;
    }

    // locate the start of the block
    const codeblockBegin = escalateToToken(
        cursor,
        Direction.Backward,
        "HyperMD-codeblock_HyperMD-codeblock-begin"
    );

    if (codeblockBegin == null) {
        console.warn(
            "unable to locate start of the codeblock even though inside one"
        );
        return "";
    }

    // extract the language
    // codeblocks may start and end with an arbitrary number of backticks
    const language = state
        .sliceDoc(codeblockBegin.from, codeblockBegin.to)
        .replace(/`+/, "");

    return language;
};
