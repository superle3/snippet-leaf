import type {
    EditorView as EditorViewC,
    Decoration as DecorationC,
} from "@codemirror/view";
import type { EditorSelection as EditorSelectionC } from "@codemirror/state";
import type {
    StateEffect as StateEffectC,
    StateField as StateFieldC,
} from "@codemirror/state";
import type { TabstopGroupC } from "../tabstop";

export function create_tabstopsStateField(
    StateEffect: typeof StateEffectC,
    StateField: typeof StateFieldC,
    Decoration: typeof DecorationC,
    EditorView: typeof EditorViewC,
) {
    const addTabstopsEffect = StateEffect.define<TabstopGroupC[]>();
    const removeAllTabstopsEffect = StateEffect.define();

    const tabstopsStateField = StateField.define<TabstopGroupC[]>({
        create() {
            return [];
        },

        update(value, transaction) {
            let tabstopGroups = value;

            for (const effect of transaction.effects) {
                if (effect.is(addTabstopsEffect)) {
                    tabstopGroups.unshift(...effect.value);
                } else if (effect.is(removeAllTabstopsEffect)) {
                    tabstopGroups = [];
                }
            }
            tabstopGroups.forEach((grp) => grp.map(transaction.changes));

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

    function getTabstopGroupsFromView(view: EditorViewC) {
        const currentTabstopGroups = view.state.field(tabstopsStateField);

        return currentTabstopGroups;
    }

    function addTabstops(tabstopGroups: TabstopGroupC[]) {
        return {
            effects: [addTabstopsEffect.of(tabstopGroups)],
        };
    }

    function removeAllTabstops(view: EditorViewC) {
        view.dispatch({
            effects: [removeAllTabstopsEffect.of(null)],
        });
    }

    // const COLORS = ["lightskyblue", "orange", "lime"];
    const N_COLORS = 3;

    function getNextTabstopColor(view: EditorViewC) {
        const field = view.state.field(tabstopsStateField);
        const existingColors = field.map((tabstopGroup) => tabstopGroup.color);
        const uniqueExistingColors = new Set(existingColors);

        for (let i = 0; i < N_COLORS; i++) {
            if (!uniqueExistingColors.has(i)) return i;
        }

        return 0;
    }
    return {
        addTabstops,
        removeAllTabstops,
        getTabstopGroupsFromView,
        tabstopsStateField,
        getNextTabstopColor,
    };
}
