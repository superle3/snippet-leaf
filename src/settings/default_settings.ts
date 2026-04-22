import { DEFAULT_SNIPPETS } from "src/utils/default_snippets";
import { DEFAULT_SNIPPET_VARIABLES } from "src/utils/default_snippet_variables";
import type {
    RawSnippet,
    Snippet,
    SnippetVariables,
} from "codemirror_extension/codemirror_extensions";
import type {
    latexSuiteBasicSettingsSchema,
    LatexSuiteParsedSettingsSchema,
    LatexSuiteRawOrParsedSettingsSchema,
    LatexSuiteRawSettingsSchema,
    SettingsSchema,
    SnippetSchemaAsync,
} from "./settings";
import type * as v from "valibot";

export const DEFAULT_SETTINGS: LatexSuitePluginSettings &
    LatexSuiteRawSettings = {
    snippets: DEFAULT_SNIPPETS,
    snippetVariables: DEFAULT_SNIPPET_VARIABLES,

    // Basic settings
    snippetsEnabled: true,
    snippetsTrigger: "Tab",
    defaultSnippetVersion: 2,
    suppressSnippetTriggerOnIME: true,
    removeSnippetWhitespace: false,
    autoDelete$: true,
    concealEnabled: false,
    concealRevealTimeout: 0,
    concealLinewise: false,
    colorPairedBracketsEnabled: true,
    highlightCursorBracketsEnabled: true,
    autofractionEnabled: true,
    autofractionSymbol: "\\frac",
    autofractionBreakingChars: "+-=\t",
    matrixShortcutsEnabled: true,
    taboutEnabled: true,
    autoEnlargeBrackets: true,
    wordDelimiters: "., +-\\n\t:;!?\\/{}[]()=~$",

    // Raw settings
    autofractionExcludedEnvs: '[\n\t["^{", "}"],\n\t["\\\\pu{", "}"]\n]',
    matrixShortcutsEnvNames:
        "pmatrix, cases, align, gather, bmatrix, Bmatrix, vmatrix, Vmatrix, array, matrix",
    autoEnlargeBracketsTriggers: "sum, int, frac, prod, bigcup, bigcap",
} as const;

export type LatexSuitePluginSettings = {
    snippets: Array<RawSnippet | Snippet>;
    snippetVariables: SnippetVariables;
} & LatexSuiteBasicSettings &
    v.InferInput<typeof LatexSuiteRawOrParsedSettingsSchema>;
export type LatexSuiteBasicSettings = v.InferOutput<
    typeof latexSuiteBasicSettingsSchema
>;
export type LatexSuiteRawSettings = v.InferInput<
    typeof LatexSuiteRawSettingsSchema
>;
export type LatexSuiteParsedSettings = v.InferInput<
    typeof LatexSuiteParsedSettingsSchema
>;

export type LatexSuiteCMSettings = v.InferOutput<typeof SettingsSchema>;
export type LatexSuitePluginSettingsRaw = v.InferInput<typeof SettingsSchema> &
    v.InferInput<typeof SnippetSchemaAsync> &
    v.InferInput<typeof LatexSuiteRawSettingsSchema>;
