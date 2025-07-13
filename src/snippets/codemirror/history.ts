import type {
    EditorView as EditorViewC,
    Decoration as DecorationC,
    ViewUpdate,
} from "@codemirror/view";
import type {
    StateEffect as StateEffectC,
    StateField as StateFieldC,
} from "@codemirror/state";
import type {
    invertedEffects as invertedEffectsC,
    undo as undoC,
    redo as redoC,
} from "@codemirror/commands";
import { create_tabstopsStateField } from "./tabstops_state_field";

// Effects that mark the beginning and end of transactions to insert snippets
export function stateEffect_variables(
    StateEffect: typeof StateEffectC,
    invertedEffects: typeof invertedEffectsC,
    undo: typeof undoC,
    redo: typeof redoC,
    StateField: typeof StateFieldC,
    Decoration: typeof DecorationC,
    EditorView: typeof EditorViewC
) {
    const removeAllTabstops = create_tabstopsStateField(
        StateEffect,
        StateField,
        Decoration,
        EditorView
    ).removeAllTabstops;
    const startSnippet = StateEffect.define();
    const endSnippet = StateEffect.define();
    const undidStartSnippet = StateEffect.define();
    const undidEndSnippet = StateEffect.define();

    // Enables undoing and redoing snippets, taking care of the tabstops
    const snippetInvertedEffects = invertedEffects.of((tr) => {
        const effects = [];

        for (const effect of tr.effects) {
            if (effect.is(startSnippet)) {
                effects.push(undidStartSnippet.of(null));
            } else if (effect.is(undidStartSnippet)) {
                effects.push(startSnippet.of(null));
            } else if (effect.is(endSnippet)) {
                effects.push(undidEndSnippet.of(null));
            } else if (effect.is(undidEndSnippet)) {
                effects.push(endSnippet.of(null));
            }
        }

        return effects;
    });

    const handleUndoRedo = (update: ViewUpdate) => {
        const undoTr = update.transactions.find((tr) => tr.isUserEvent("undo"));
        const redoTr = update.transactions.find((tr) => tr.isUserEvent("redo"));

        for (const tr of update.transactions) {
            for (const effect of tr.effects) {
                if (effect.is(startSnippet)) {
                    if (redoTr) {
                        // Redo the tabstop expansion and selection
                        redo(update.view);
                    }
                } else if (effect.is(undidEndSnippet)) {
                    if (undoTr) {
                        // Undo the tabstop expansion and selection
                        undo(update.view);
                    }
                }
            }
        }

        if (undoTr) {
            removeAllTabstops(update.view);
        }
    };
    return {
        startSnippet,
        endSnippet,
        undidStartSnippet,
        undidEndSnippet,
        snippetInvertedEffects,
        handleUndoRedo,
    };
}
