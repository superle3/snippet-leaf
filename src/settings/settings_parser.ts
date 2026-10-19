import type { PluginSnippetApi } from "src/snippets/luasnip_api";
import type { SnippetVariables, SnippetVersion } from "src/snippets/parse";
import { parseSnippets } from "src/snippets/parse";
import { parseSnippetVariables } from "src/snippets/intermediate-parse";

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
    defaultSnippetVersion: SnippetVersion = 2,
    identifier: string = "snippets.ts",
    pluginApi: PluginSnippetApi,
) {
    try {
        return await parseSnippets(
            snippets,
            snippetVariables,
            defaultSnippetVersion,
            identifier,
            pluginApi,
        );
    } catch (e) {
        console.error(`Failed to load snippets from settings: ${e}`);
        return [];
    }
}
