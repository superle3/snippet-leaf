import type { EditorView as EditorViewC } from "@codemirror/view";
import type {
    EditorSelection as EditorSelectionC,
    StateEffectType,
} from "@codemirror/state";
import type { StateField as StateFieldC } from "@codemirror/state";
import type { TabstopGroupC } from "../tabstop";
import {
    Decoration,
    EditorView,
    StateField,
    StateEffect,
} from "src/set_codemirror_objects";
export let addTabstopsEffect: StateEffectType<TabstopGroupC[]>;
export let removeAllTabstopsEffect: StateEffectType<null>;
export let tabstopsStateField: StateFieldC<TabstopGroupC[]>;
export function create_tabstopsStateField() {
    addTabstopsEffect = StateEffect.define<TabstopGroupC[]>();
    removeAllTabstopsEffect = StateEffect.define();

    tabstopsStateField = StateField.define<TabstopGroupC[]>({
        create() {
            return [];
        },

        update(value, transaction) {
            let tabstopGroups = value;
            // Optimization: tabstops that are added should already have their changes applied
            // So changes are only applied to existing tabstops
            tabstopGroups.forEach((grp) => grp.map(transaction.changes));
            for (const effect of transaction.effects) {
                if (effect.is(addTabstopsEffect)) {
                    tabstopGroups.unshift(...effect.value);
                } else if (effect.is(removeAllTabstopsEffect)) {
                    tabstopGroups = [];
                }
            }

            // Remove the tabstop groups that the cursor has passed. This scenario
            // happens when the user manually moves the cursor using arrow keys or mouse
            if (transaction.selection) {
                const currTabstopGroupIndex = getCurrentTabstopGroupIndex(
                    tabstopGroups,
                    transaction.selection,
                );
                tabstopGroups = tabstopGroups.slice(currTabstopGroupIndex);

                if (tabstopGroups.length <= 1) {
                    // Clear all tabstop groups if there's just one remaining
                    tabstopGroups = [];
                } else {
                    tabstopGroups[0].hideFromEditor();
                }
            }

            return tabstopGroups;
        },

        provide: (field) => {
            return EditorView.decorations.of((view) => {
                // "Flatten" the array of DecorationSets to produce a single DecorationSet
                const tabstopGroups = view.state.field(field);
                const decos = [];

                for (const tabstopGroup of tabstopGroups) {
                    if (!tabstopGroup.hidden)
                        decos.push(...tabstopGroup.getRanges());
                }

                return Decoration.set(decos, true);
            });
        },
    });

    function getCurrentTabstopGroupIndex(
        tabstopGroups: TabstopGroupC[],
        sel: EditorSelectionC,
    ): number {
        for (let i = 0; i < tabstopGroups.length; i++) {
            const tabstopGroup = tabstopGroups[i];
            if (tabstopGroup.containsSelection(sel)) return i;
        }
        return tabstopGroups.length;
    }

    return {
        addTabstops,
        removeAllTabstops,
        getTabstopGroupsFromView,
        tabstopsStateField,
        getNextTabstopColor,
    };
}

export function addTabstops(tabstopGroups: TabstopGroupC[]) {
    return {
        effects: [addTabstopsEffect.of(tabstopGroups)],
    };
}
export function removeAllTabstops(view: EditorViewC) {
    view.dispatch({
        effects: [removeAllTabstopsEffect.of(null)],
    });
}

export function getTabstopGroupsFromView(view: EditorViewC) {
    const currentTabstopGroups = view.state.field(tabstopsStateField);

    return currentTabstopGroups;
}
// const COLORS = ["lightskyblue", "orange", "lime"];
const N_COLORS = 3;

export function getNextTabstopColor(view: EditorViewC) {
    const field = view.state.field(tabstopsStateField);
    const existingColors = field.map((tabstopGroup) => tabstopGroup.color);
    const uniqueExistingColors = new Set(existingColors);

    for (let i = 0; i < N_COLORS; i++) {
        if (!uniqueExistingColors.has(i)) return i;
    }

    return 0;
}
