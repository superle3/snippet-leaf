import default_snippet_variables_str from "src/default_snippet_variables.json5?raw";
import type { SnippetVariables } from "src/extension";
import default_snippet_variables_json from "src/default_snippet_variables.json5?json5";

export const DEFAULT_SNIPPET_VARIABLES_str: string =
    default_snippet_variables_str;
export const DEFAULT_SNIPPET_VARIABLES =
    default_snippet_variables_json as SnippetVariables;
