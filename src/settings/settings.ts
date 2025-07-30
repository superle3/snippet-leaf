import { ARE_SETTINGS_PARSED, type Snippet } from "../snippets/snippets";
import type { Environment } from "../snippets/environment";
import {
    DEFAULT_SNIPPETS,
    DEFAULT_SNIPPETS_str,
} from "../utils/default_snippets";
import {
    DEFAULT_SNIPPET_VARIABLES,
    DEFAULT_SNIPPET_VARIABLES_str,
} from "../utils/default_snippet_variables";
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
    concealEnabled: boolean;
    concealRevealTimeout: number;
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
    snippets: Array<RawSnippet | Snippet>;
    snippetVariables: SnippetVariables;
} & LatexSuiteBasicSettings &
    LatexSuiteRawSettings;
export type LatexSuitePluginSettingsRaw = {
    snippets: Array<RawSnippet | Snippet> | string;
    snippetVariables: SnippetVariables | string;
} & LatexSuiteBasicSettings &
    LatexSuiteRawSettings;
export type LatexSuiteCMSettings = {
    snippets: readonly Snippet[];
    snippetVariables: Readonly<SnippetVariables>;
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
    concealEnabled: true,
    concealRevealTimeout: 1000,
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
    settings: LatexSuitePluginSettings & {
        snippets: Array<RawSnippet | Snippet>;
        snippetVariables: Record<string, string>;
    }
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
    Partial<LatexSuitePluginSettings> | Partial<LatexSuiteCMSettings>,
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

export type LatexSuitePluginSettingsExplanations = {
    [P in keyof LatexSuitePluginSettingsRaw]: {
        title: string;
        description: string;
        type: "boolean" | "string" | "array" | Array<string>;
        defaultValue: LatexSuitePluginSettingsRaw[P];
    };
};

export const SETTINGS_EXPLANATIONS: LatexSuitePluginSettingsExplanations = {
    snippetsEnabled: {
        title: "Enabled",
        description: "Whether snippets are enabled.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.snippetsEnabled,
    },
    snippets: {
        title: "Snippets",
        description:
            'Enter snippets here.  Remember to add a comma after each snippet, and escape all backslashes with an extra \\. Lines starting with "//" will be treated as comments and ignored.',
        type: "array",
        defaultValue: DEFAULT_SNIPPETS_str,
    },
    snippetVariables: {
        title: "Snippet variables",
        description:
            "Assign snippet variables that can be used as shortcuts when writing snippets.",
        type: "string",
        defaultValue: DEFAULT_SNIPPET_VARIABLES_str,
    },
    snippetsTrigger: {
        title: "Key trigger for non-auto snippets",
        description: "What key to press to expand non-auto snippets.",
        type: ["Tab", " "],
        defaultValue: DEFAULT_SETTINGS.snippetsTrigger,
    },
    suppressSnippetTriggerOnIME: {
        title: "Don't trigger snippets when IME is active",
        description:
            "Whether to suppress snippets triggering when an IME is active.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.suppressSnippetTriggerOnIME,
    },
    removeSnippetWhitespace: {
        title: "Remove trailing whitespaces in snippets in inline math",
        description:
            "Whether to remove trailing whitespaces when expanding snippets at the end of inline math blocks.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.removeSnippetWhitespace,
    },
    autoDelete$: {
        title: "Remove closing $ when backspacing inside blank inline math",
        description:
            "Whether to also remove the closing $ when you delete the opening $ symbol inside blank inline math.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.autoDelete$,
    },
    autofractionEnabled: {
        title: "Enabled",
        description: "Whether auto-fraction is enabled.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.autofractionEnabled,
    },
    autofractionSymbol: {
        title: "Fraction symbol",
        description:
            "The fraction symbol to use in the replacement. e.g. \\frac, \\dfrac, \\tfrac",
        type: ["\\frac", "\\dfrac", "\\tfrac"],
        defaultValue: DEFAULT_SETTINGS.autofractionSymbol,
    },
    autofractionBreakingChars: {
        title: "Breaking characters",
        description:
            'A list of characters that denote the start/end of a fraction. e.g. if + is included in the list, "a+b/c" will expand to "a+\\frac{b}{c}". If + is not in the list, it will expand to "\\frac{a+b}{c}".',
        type: "string",
        defaultValue: DEFAULT_SETTINGS.autofractionBreakingChars,
    },
    matrixShortcutsEnabled: {
        title: "Enabled",
        description: "Whether matrix shortcuts are enabled.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.matrixShortcutsEnabled,
    },
    taboutEnabled: {
        title: "Enabled",
        description: "Whether tabout is enabled",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.taboutEnabled,
    },
    autoEnlargeBrackets: {
        title: "Enabled",
        description:
            "Whether to automatically enlarge brackets containing e.g. sum, int, frac.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.autoEnlargeBrackets,
    },
    wordDelimiters: {
        title: "Word delimiters",
        description:
            'Symbols that will be treated as word delimiters, for use with the "w" snippet option.',
        type: "string",
        defaultValue: DEFAULT_SETTINGS.wordDelimiters,
    },
    autofractionExcludedEnvs: {
        title: "Excluded environments",
        description:
            'A list of environments to exclude auto-fraction from running in. For example, to exclude auto-fraction from running while inside an exponent, such as e^{...}, use  ["^{", "}"]',
        type: "string",
        defaultValue: DEFAULT_SETTINGS.autofractionExcludedEnvs,
    },
    matrixShortcutsEnvNames: {
        title: "Environments",
        description:
            "A list of environment names to run the matrix shortcuts in, separated by commas.",
        type: "string",
        defaultValue: DEFAULT_SETTINGS.matrixShortcutsEnvNames,
    },
    autoEnlargeBracketsTriggers: {
        title: "Enabled",
        description:
            "Whether to automatically enlarge brackets containing e.g. sum, int, frac.",
        type: "string",
        defaultValue: DEFAULT_SETTINGS.autoEnlargeBracketsTriggers,
    },
    concealEnabled: {
        title: "Enabled",
        description:
            " Make equations more readable by hiding LaTeX syntax and instead displaying it in a pretty format.\n e.g. <code>\\dot{x}^{2} + \\dot{y}^{2}</code> will display as ẋ² + ẏ², and <code>\\sqrt{ 1-\\beta^{2} }</code> will display as √{ 1-β² }.\n LaTeX beneath the cursor will be revealed.\n Disabled by default to not confuse new users. However, I recommend turning this on once you are comfortable with the plugin!.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.concealEnabled,
    },
    concealRevealTimeout: {
        title: "Reveal delay (ms)",
        description:
            " How long to delay the reveal of LaTeX for, in milliseconds, when the cursor moves over LaTeX. Defaults to 0 (LaTeX under the cursor is revealed immediately).\n Can be set to a positive number, e.g. 300, to delay the reveal of LaTeX, making it much easier to navigate equations using arrow keys.\n Must be an integer ≥ 0. ",
        type: "string",
        defaultValue: DEFAULT_SETTINGS.concealRevealTimeout,
    },
} as const;
