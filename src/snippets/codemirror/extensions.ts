import type { stateEffect_variables } from "./history";
import type { create_tabstopsStateField } from "./tabstops_state_field";

export function create_snippet_extensions(
    tabstopsStateField: ReturnType<
        typeof create_tabstopsStateField
    >["tabstopsStateField"],
    snippetInvertedEffects: ReturnType<
        typeof stateEffect_variables
    >["snippetInvertedEffects"],
) {
    return [tabstopsStateField.extension, snippetInvertedEffects];
}
