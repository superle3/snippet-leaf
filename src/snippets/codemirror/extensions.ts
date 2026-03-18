import { snippetInvertedEffects } from "./history";
import { tabstopsStateField } from "./tabstops_state_field";

export function create_snippet_extensions() {
    return [tabstopsStateField.extension, snippetInvertedEffects];
}
