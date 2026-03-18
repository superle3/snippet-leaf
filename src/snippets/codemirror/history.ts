import { type ViewUpdate } from "@codemirror/view";
// import type {
//     StateEffect as StateEffectC,
//     StateField as StateFieldC,
// } from "@codemirror/state";
// import type {
//     invertedEffects as invertedEffectsC,
//     undo as undoC,
//     redo as redoC,
// } from "@codemirror/commands";

import { removeAllTabstops } from "./tabstops_state_field";
import {
    invertedEffects,
    redo,
    StateEffect,
    undo,
} from "src/set_codemirror_objects";
import type { Extension, StateEffectType } from "@codemirror/state";

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
