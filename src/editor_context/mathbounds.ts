import type { EditorState } from "@codemirror/state";
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import type { TreeCursor } from "@lezer/common";
import type { EquationInfo } from "./context";
import { mathContext } from "./context";
import { syntaxTree } from "@codemirror/language";
import { iterateParents } from "src/utils/tokenizer";
// type STRICTLY_MATH_MODE =
//     | "ParenMath"
//     | "InlineMath"
//     | "DisplayMath"
//     | "BracketMath"
//     | "EquationArray"
//     | "EquationEnvironment";

// type MathBounds = FullBounds & { mode: (typeof STRICTLY_MATH_MODE)[number] };
//
export type EquationOverlay = {
    bound: EquationInfo;
    text: string;
    overlay: { from: number; to: number };
};

class MathBoundsPlugin {
    mathBounds: EquationInfo[] = [];
    equations: Map<number, string> | null = null;
    private equationsOverlays: EquationOverlay[] | null = null;

    constructor(view: EditorView) {
        this.updateMathBounds(view);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            this.equations = null;
            this.equationsOverlays = null;
            this.updateMathBounds(update.view);
        }
    }

    getOuterMathBounds(
        from: number,
        to: number,
        view: EditorView,
    ): EquationInfo[] {
        const bounds: EquationInfo[] = [];
        const tree = syntaxTree(view.state);
        if (tree.length < from) return bounds;
        const startCursor = tree.cursor();
        startCursor.moveTo(from, -1);
        let parentCursor: TreeCursor | undefined;
        for (const parent of Array.from(
            iterateParents(startCursor.node),
        ).reverse()) {
            const result = mathContext[parent.name]?.(parent, view.state);
            if (result) {
                parentCursor = parent.cursor();
                bounds.push(result);
                parentCursor.moveTo(parent.to, 1);
                break;
            }
        }
        const cursor = parentCursor !== undefined ? parentCursor : startCursor;
        while (
            parentCursor === undefined &&
            startCursor.to < from &&
            cursor.next()
        ) {
            /* empty */
        }
        let skipMove = false;
        let counter = 0;
        do {
            counter++;
            skipMove = false;
            const result = mathContext[cursor.node.name]?.(
                cursor.node,
                view.state,
            );
            if (result) {
                bounds.push(result);
                const node = cursor.node;
                cursor.moveTo(cursor.to, 1);
                if (cursor.from < node.to || node.type.isTop) {
                    break;
                }
            }
        } while (
            (skipMove || cursor.next()) &&
            cursor.from < to &&
            counter < 1000
        );
        if (counter >= 1000) {
            console.warn(
                "MathBoundsPlugin: Exceeded maximum iterations while searching for math bounds.",
            );
        }
        return bounds;
    }

    updateMathBounds(view: EditorView) {
        const equations: EquationInfo[] = [];
        view.visibleRanges.forEach(({ from, to }) => {
            const added_equations = this.getOuterMathBounds(from, to, view);
            const last_equation = equations[equations.length - 1];
            let i = 0;
            if (last_equation) {
                for (; i < added_equations.length; i++) {
                    const eq = added_equations[i]!;
                    if (eq.outer_start > last_equation.outer_end) {
                        break;
                    }
                }
            }
            equations.push(...added_equations.slice(i));
        });
        this.mathBounds = equations;
    }

    inMathBound = (_state: EditorState, pos: number): EquationInfo | null => {
        const bounds = this.mathBounds;
        const first_bound = bounds[0];
        const last_bound = bounds[bounds.length - 1];
        if (!first_bound || !last_bound) {
            return null;
        }
        if (pos <= first_bound.outer_start || pos >= last_bound.outer_end) {
            return null;
        }
        // Use binary search to efficiently find if pos is within any math bound
        let left = 0,
            right = bounds.length - 1;
        while (left <= right) {
            const mid = (left + right) >> 1;
            const bound = bounds[mid];
            if (!bound) break;
            if (pos < bound.outer_start) {
                right = mid - 1;
            } else if (pos >= bound.outer_end) {
                left = mid + 1;
            } else if (pos <= bound.inner_start || pos > bound.inner_end) {
                break;
            } else {
                return bound;
            }
        }
        return null;
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
        _state: EditorState,
        _pos?: number,
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

    getEquationOverlays(state: EditorState) {
        if (this.equationsOverlays) return this.equationsOverlays;
        this.equationsOverlays = this.mathBounds.map((bound) => ({
            bound,
            overlay: { from: bound.inner_start, to: bound.inner_end },
            text: state.sliceDoc(bound.inner_start, bound.inner_end),
        }));
        return this.equationsOverlays;
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
