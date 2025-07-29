import { ARE_SETTINGS_PARSED, type Snippet } from "../snippets/snippets";
import type { Environment } from "../snippets/environment";
import { DEFAULT_SNIPPETS } from "src/default_snippets";
import { DEFAULT_SNIPPET_VARIABLES } from "src/default_snippet_variables";
import {
    parseSnippets,
    parseSnippetsSync,
    parseSnippetVariables,
    type RawSnippet,
    type SnippetVariables,
} from "src/snippets/parse";
import type { EditorState, Facet as FacetC } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

interface LatexSuiteBasicSettings {
    snippetsEnabled: boolean;
    snippetsTrigger: "Tab" | " ";
    suppressSnippetTriggerOnIME: boolean;
    removeSnippetWhitespace: boolean;
    autoDelete$: boolean;
    loadSnippetsFromFile: boolean;
    loadSnippetVariablesFromFile: boolean;
    snippetsFileLocation: string;
    snippetVariablesFileLocation: string;
    autofractionEnabled: boolean;
    autofractionSymbol: string;
    autofractionBreakingChars: string;
    matrixShortcutsEnabled: boolean;
    taboutEnabled: boolean;
    autoEnlargeBrackets: boolean;
    wordDelimiters: string;
}

/**
 * Settings that require further processing (e.g. conversion to an array) before being used.
 */
interface LatexSuiteRawSettings {
    autofractionExcludedEnvs: string | Environment[];
    matrixShortcutsEnvNames: string | string[];
    autoEnlargeBracketsTriggers: string | string[];
}

interface LatexSuiteParsedSettings {
    autofractionExcludedEnvs: Environment[];
    matrixShortcutsEnvNames: string[];
    autoEnlargeBracketsTriggers: string[];
}

export type LatexSuitePluginSettings = {
    snippets: RawSnippet[] | Snippet[];
    snippetVariables: SnippetVariables;
} & LatexSuiteBasicSettings &
    LatexSuiteRawSettings;
export type LatexSuiteCMSettings = {
    snippets: Snippet[];
    snippetVariables: SnippetVariables;
} & LatexSuiteBasicSettings &
    LatexSuiteParsedSettings;

export const DEFAULT_SETTINGS: LatexSuitePluginSettings = {
    snippets: DEFAULT_SNIPPETS,
    snippetVariables: DEFAULT_SNIPPET_VARIABLES,

    // Basic settings
    snippetsEnabled: true,
    snippetsTrigger: "Tab",
    suppressSnippetTriggerOnIME: true,
    removeSnippetWhitespace: true,
    autoDelete$: true,
    loadSnippetsFromFile: false,
    loadSnippetVariablesFromFile: false,
    snippetsFileLocation: "",
    snippetVariablesFileLocation: "",
    autofractionEnabled: true,
    autofractionSymbol: "\\frac",
    autofractionBreakingChars: "+-=\t",
    matrixShortcutsEnabled: true,
    taboutEnabled: true,
    autoEnlargeBrackets: true,
    wordDelimiters: "., +-\\n\t:;!?\\/{}[]()=~$",

    // Raw settings
    autofractionExcludedEnvs: `[
		["^{", "}"],
		["\\\\pu{", "}"]
	]`,
    matrixShortcutsEnvNames:
        "pmatrix, cases, align, gather, bmatrix, Bmatrix, vmatrix, Vmatrix, array, matrix",
    autoEnlargeBracketsTriggers: "sum, int, frac, prod, bigcup, bigcap",
};

export function processLatexSuiteSettings(
    settings: LatexSuitePluginSettings
): LatexSuiteCMSettings {
    function strToArray(str: string | string[]) {
        return Array.isArray(str)
            ? str.map((s) => s.replace(/\s/g, ""))
            : str.replace(/\s/g, "").split(",");
    }

    function getAutofractionExcludedEnvs(
        envsStr: string | Environment[]
    ): Environment[] {
        if (Array.isArray(envsStr)) {
            for (const env of envsStr) {
                if (
                    typeof env !== "object" ||
                    !("openSymbol" in env) ||
                    !("closeSymbol" in env)
                ) {
                    throw new Error(
                        "Invalid environment format in autofractionExcludedEnvs. Expected an array of objects with openSymbol and closeSymbol properties."
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
        settings.snippetVariables
    );

    const snippets = [
        ...settings.snippets.filter(
            (snippet) => ARE_SETTINGS_PARSED in snippet
        ),
        ...parseSnippetsSync(
            settings.snippets.filter(
                (snippet) => !(ARE_SETTINGS_PARSED in snippet)
            ) as RawSnippet[],
            snippetVariables
        ),
    ];
    return {
        ...settings,

        // Override raw settings with parsed settings
        snippets,
        snippetVariables,
        autofractionExcludedEnvs: getAutofractionExcludedEnvs(
            settings.autofractionExcludedEnvs
        ),
        matrixShortcutsEnvNames: strToArray(settings.matrixShortcutsEnvNames),
        autoEnlargeBracketsTriggers: strToArray(
            settings.autoEnlargeBracketsTriggers
        ),
    };
}
export type LatexSuiteFacet = FacetC<
    LatexSuiteCMSettings,
    LatexSuiteCMSettings
>;

export function getLatexSuiteConfig(
    viewOrState: EditorView | EditorState,
    latexSuiteConfig: LatexSuiteFacet
): LatexSuiteCMSettings {
    const state = (viewOrState as EditorView).state
        ? (viewOrState as EditorView).state
        : (viewOrState as EditorState);

    return state.facet(latexSuiteConfig);
}

export async function getSettingsSnippetVariables(snippetVariables: string) {
    try {
        return await parseSnippetVariables(snippetVariables);
    } catch (e) {
        console.error(`Failed to load snippet variables from settings: ${e}`);
        return {};
    }
}

export async function getSettingsSnippets(
    snippets: string,
    snippetVariables: SnippetVariables
) {
    try {
        return await parseSnippets(snippets, snippetVariables);
    } catch (e) {
        console.error(`Failed to load snippets from settings: ${e}`);
        return [];
    }
}

function validateSnippetVariables(
    snippetVariables: Record<string, string>
): SnippetVariables {
    for (const [key, value] of Object.entries(snippetVariables)) {
        if (typeof value !== "string") {
            throw new Error(
                `Invalid snippet variable value: ${value}. Value must be strings.`
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
                `Invalid snippet variable key: ${key}. Keys must be enclosed in \${}.`
            );
        }
    }
    return snippetVariables;
}
