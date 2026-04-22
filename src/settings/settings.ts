import { ARE_SETTINGS_PARSED, type Snippet } from "../snippets/snippets";
import type { Environment } from "../snippets/environment";
import {
    parseSnippetsSync,
    type RawSnippet,
    type SnippetVariables,
} from "src/snippets/parse";
import type { Facet } from "@codemirror/state";
import type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
} from "./default_settings";

export function processLatexSuiteSettings(
    settings: LatexSuitePluginSettings & {
        snippets: Array<RawSnippet | Snippet>;
        snippetVariables: Record<string, string>;
    },
): LatexSuiteCMSettings {
    function strToArray(str: string | string[]) {
        return Array.isArray(str)
            ? str.map((s) => s.replace(/\s/g, ""))
            : str.replace(/\s/g, "").split(",");
    }

    function getAutofractionExcludedEnvs(
        envsStr: string | Environment[],
    ): Environment[] {
        if (Array.isArray(envsStr)) {
            for (const env of envsStr) {
                if (
                    typeof env !== "object" ||
                    !("openSymbol" in env) ||
                    !("closeSymbol" in env)
                ) {
                    throw new Error(
                        "Invalid environment format in autofractionExcludedEnvs. Expected an array of objects with openSymbol and closeSymbol properties.",
                    );
                }
            }
            return envsStr as Environment[];
        }
        let envs = [];

        try {
            const envsJSON = JSON.parse(envsStr);
            envs = envsJSON.map(function (env: string[]) {
                return { openSymbol: env[0], closeSymbol: env[1] };
            });
        } catch (e) {
            console.log(e);
        }

        return envs;
    }
    const snippetVariables = validateSnippetVariables(
        settings.snippetVariables,
    );
    const snippets = [
        ...settings.snippets.filter(
            (snippet) => ARE_SETTINGS_PARSED in snippet,
        ),
        ...parseSnippetsSync(
            settings.snippets.filter(
                (snippet) => !(ARE_SETTINGS_PARSED in snippet),
            ) as RawSnippet[],
            snippetVariables,
        ),
    ];
    return {
        ...settings,

        // Override raw settings with parsed settings
        snippets,
        snippetVariables,
        autofractionExcludedEnvs: getAutofractionExcludedEnvs(
            settings.autofractionExcludedEnvs,
        ),
        matrixShortcutsEnvNames: strToArray(settings.matrixShortcutsEnvNames),
        autoEnlargeBracketsTriggers: strToArray(
            settings.autoEnlargeBracketsTriggers,
        ),
    };
}
export type LatexSuiteFacet = Facet<
    Partial<LatexSuitePluginSettings>,
    LatexSuiteCMSettings
>;

function validateSnippetVariables(
    snippetVariables: Record<string, string>,
): SnippetVariables {
    for (const [key, value] of Object.entries(snippetVariables)) {
        if (typeof value !== "string") {
            throw new Error(
                `Invalid snippet variable value: ${value}. Value must be strings.`,
            );
        }
        if (
            !(
                typeof key === "string" &&
                key.startsWith("${") &&
                key.endsWith("}")
            )
        ) {
            throw new Error(
                `Invalid snippet variable key: ${key}. Keys must be enclosed in \${}.`,
            );
        }
    }
    return snippetVariables;
}
