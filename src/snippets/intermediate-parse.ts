import json5 from "json5";
import type { SnippetVariables } from "./parse";

export function parseSnippetVariables(snippetVariablesStr: string) {
    const rawSnippetVariables = json5.parse(snippetVariablesStr);
    return parseSnippetVariablesSync(rawSnippetVariables);
}

export function parseSnippetVariablesSync(
    rawSnippetVariables: SnippetVariables | Record<string, string>,
) {
    if (Array.isArray(rawSnippetVariables))
        throw new Error("Cannot parse an array as a variables object");

    const snippetVariables: SnippetVariables = {};
    for (const [variable, value] of Object.entries(rawSnippetVariables)) {
        if (variable.startsWith("${")) {
            if (!variable.endsWith("}")) {
                throw new Error(
                    `Invalid snippet variable name '${variable}': Starts with '\${' but does not end with '}'. You need to have both or neither.`,
                );
            }
            snippetVariables[variable] = value;
        } else {
            if (variable.endsWith("}")) {
                throw new Error(
                    `Invalid snippet variable name '${variable}': Ends with '}' but does not start with '\${'. You need to have both or neither.`,
                );
            }
            snippetVariables["${" + variable + "}"] = value;
        }
    }
    return snippetVariables;
}
