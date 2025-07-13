import { stateEffect_variables } from "./history";
import { create_tabstopsStateField } from "./tabstops_state_field";
import { snippetQueues } from "./snippet_queue_state_field";
import type {
    StateEffect as StateEffectC,
    StateField as StateFieldC,
} from "@codemirror/state";
import type {
    invertedEffects as invertedEffectsC,
    redo as redoC,
    undo as undoC,
} from "@codemirror/commands";
import type {
    Decoration as DecorationC,
    EditorView as EditorViewC,
} from "@codemirror/view";

export function create_snippet_extensions(
    tabstopsStateField: ReturnType<
        typeof create_tabstopsStateField
    >["tabstopsStateField"],
    snippetQueueStateField: ReturnType<
        typeof snippetQueues
    >["snippetQueueStateField"],
    snippetInvertedEffects: ReturnType<
        typeof stateEffect_variables
    >["snippetInvertedEffects"]
) {
    return [
        tabstopsStateField.extension,
        snippetQueueStateField.extension,
        snippetInvertedEffects,
    ];
}
