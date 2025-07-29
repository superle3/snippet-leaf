import type { stateEffect_variables } from "./history";
import type { create_tabstopsStateField } from "./tabstops_state_field";
import type { snippetQueues } from "./snippet_queue_state_field";

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
