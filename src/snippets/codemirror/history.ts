import { type ViewUpdate } from "@codemirror/view";
import { removeAllTabstops } from "./tabstops_state_field";
import {
    StateEffect,
    type Extension,
    type StateEffectType,
} from "@codemirror/state";
import { invertedEffects, redo, undo } from "@codemirror/commands";

export let startSnippet: StateEffectType<null>;
export let endSnippet: StateEffectType<null>;
export let snippetInvertedEffects: Extension;
let undidStartSnippet: StateEffectType<null>;
let undidEndSnippet: StateEffectType<null>;
// Effects that mark the beginning and end of transactions to insert snippets
export function stateEffect_variables() {
    startSnippet = StateEffect.define();
    endSnippet = StateEffect.define();
    undidStartSnippet = StateEffect.define();
    undidEndSnippet = StateEffect.define();

    // Enables undoing and redoing snippets, taking care of the tabstops
    snippetInvertedEffects = invertedEffects.of((tr) => {
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

    return {
        startSnippet,
        endSnippet,
        snippetInvertedEffects,
        handleUndoRedo,
    };
}

export const handleUndoRedo = (update: ViewUpdate) => {
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
