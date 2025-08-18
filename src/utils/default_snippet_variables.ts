// @ts-ignore
import default_snippet_variables_str from "inline:src/default_snippet_variables.json5";
import { parse } from "json5";
import type { SnippetVariables } from "src/extension";

export const DEFAULT_SNIPPET_VARIABLES_str: string =
    default_snippet_variables_str;
export const DEFAULT_SNIPPET_VARIABLES: SnippetVariables = parse(
    default_snippet_variables_str,
);
