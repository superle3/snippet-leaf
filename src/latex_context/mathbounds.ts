import type { EditorState } from "@codemirror/state";
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import type { SyntaxNode, SyntaxNodeRef } from "@lezer/common";
import type { EquationInfo } from "./context";
import { mathContext } from "./context";
import { syntaxTree } from "@codemirror/language";
export interface FullBounds {
    inner_start: number;
    inner_end: number;
    outer_start: number;
    outer_end: number;
}
type STRICTLY_MATH_MODE =
    | "ParenMath"
    | "InlineMath"
    | "DisplayMath"
    | "BracketMath"
    | "EquationArray"
    | "EquationEnvironment";

// type MathBounds = FullBounds & { mode: (typeof STRICTLY_MATH_MODE)[number] };

class MathBoundsPlugin {
    mathBounds: EquationInfo[] = [];
    equations: Map<number, string> | null = null;

    constructor(view: EditorView) {
        this.updateMathBounds(view);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            this.equations = null;
            this.updateMathBounds(update.view);
        }
    }

    updateMathBounds(view: EditorView) {
        const tree = syntaxTree(view.state);
        const math_nodes_viewports: SyntaxNode[][] = [];
        view.visibleRanges.forEach(({ from, to }, i) => {
            math_nodes_viewports.push([]);
            tree.iterate({
                from,
                to,
                enter: (node: SyntaxNodeRef) => {
                    if (node.name !== "Math") return;
                    if (
                        math_nodes_viewports[i].length > 0 &&
                        node.to <
                            math_nodes_viewports[i][
                                math_nodes_viewports[i].length - 1
                            ].to
                    )
                        return;
                    math_nodes_viewports[i].push(node.node);
                },
            });
        });
        this.mathBounds = math_nodes_viewports
            .flat()
            .filter((node: SyntaxNode, index: number, array: SyntaxNode[]) => {
                if (index === 0) return true;
                const prev_node = array[index - 1];
                return node.from >= prev_node.to;
            })
            .map((node: SyntaxNode) => {
                const parent =
                    node.parent.name === "Content"
                        ? node.parent.parent
                        : node.parent;
                return mathContext[parent.name as STRICTLY_MATH_MODE](
                    parent,
                    view.state,
                ) as EquationInfo;
            });
    }

    inMathBound = (state: EditorState, pos: number): EquationInfo | null => {
        const bounds = this.mathBounds;
        if (
            pos <= bounds[0]?.outer_start ||
            pos >= bounds[bounds.length - 1]?.outer_end
        ) {
            return this.getEquationBounds(state, pos);
        }
        // Use binary search to efficiently find if pos is within any math bound
        let left = 0,
            right = bounds.length - 1;
        while (left <= right) {
            const mid = (left + right) >> 1;
            const bound = bounds[mid];
            if (pos < bound.outer_start) {
                right = mid - 1;
            } else if (pos >= bound.outer_end) {
                left = mid + 1;
            } else if (pos <= bound.inner_start || pos >= bound.inner_end) {
                break;
            } else {
                return bound;
            }
        }
        return this.getEquationBounds(state, pos);
    };

    getEquationBounds(state: EditorState, pos?: number): EquationInfo | null {
        if (!pos) pos = state.selection.main.to;
        const bounds = this.computeEquationBounds(state, pos);
        if (!bounds) return null;
        this.addMathBound(bounds);
        return bounds;
    }

    /**
     * Figures out where this equation starts and where it ends.
     *
     * **Note:** If you intend to use this directly, check out Context.getBounds or this.inMathBound instead, which caches and also takes care of codeblock languages which should behave like math mode.
     */
    private computeEquationBounds = (
        state: EditorState,
        pos?: number,
    ): EquationInfo | null => {
        return null;
    };

    private addMathBound = (bound: EquationInfo) => {
        if (this.mathBounds.length === 0) {
            this.mathBounds.push(bound);
        } else if (bound.outer_end <= this.mathBounds[0].outer_start) {
            this.mathBounds.unshift(bound);
        } else if (
            bound.outer_start >=
            this.mathBounds[this.mathBounds.length - 1].outer_end
        ) {
            this.mathBounds.push(bound);
        } else {
            // Binary search for insertion point
            let left = 0,
                right = this.mathBounds.length - 1;
            while (left <= right) {
                const mid = (left + right) >> 1;
                if (bound.outer_start < this.mathBounds[mid].outer_start) {
                    right = mid - 1;
                } else {
                    left = mid + 1;
                }
            }
            this.mathBounds.splice(left, 0, bound);
        }
        return bound;
    };

    getEquations(state: EditorState) {
        if (this.equations) return this.equations;
        this.equations = new Map(
            this.mathBounds.map((bound) => [
                bound.inner_start,
                state.sliceDoc(bound.inner_start, bound.inner_end),
            ]),
        );
        return this.equations;
    }
}
let mathBoundsPlugin: ViewPlugin<MathBoundsPlugin>;
export const createMathBoundsPlugin = () => {
    mathBoundsPlugin = ViewPlugin.fromClass(MathBoundsPlugin);
    return mathBoundsPlugin;
};

export const getMathBoundsPlugin = (view: EditorView) => {
    const plugin = view.plugin(mathBoundsPlugin);
    if (!plugin) {
        throw new Error(
            "MathBoundsPlugin not found, something went wrong with the plugin initialization",
        );
    }
    return plugin;
};
