import type { SnippetVariables } from "src/snippets/parse";
import { parseSnippets, parseSnippetVariables } from "src/snippets/parse";

export function getSettingsSnippetVariables(snippetVariables: string) {
    try {
        return parseSnippetVariables(snippetVariables);
    } catch (e) {
        console.error(`Failed to load snippet variables from settings: ${e}`);
        return {};
    }
}
export async function getSettingsSnippets(
    snippets: string,
    snippetVariables: SnippetVariables,
    defaultSnippetVersion: 1 | 2 = 2,
) {
    try {
        return await parseSnippets(
            snippets,
            snippetVariables,
            defaultSnippetVersion,
        );
    } catch (e) {
        console.error(`Failed to load snippets from settings: ${e}`);
        return [];
    }
}
