import { DEFAULT_SNIPPETS } from "src/utils/default_snippets";
import { DEFAULT_SNIPPET_VARIABLES } from "src/utils/default_snippet_variables";
import type { RawSnippet, SnippetVariables } from "src/snippets/parse";
import type {
    latexSuiteBasicSettingsSchema,
    latexSuiteKeymapSettingsSchema,
    LatexSuiteParsedSettingsSchema,
    LatexSuiteRawOrParsedSettingsSchema,
    LatexSuiteRawSettingsSchema,
    SettingsSchema,
    SnippetSchemaAsync,
} from "./settings";
import type * as v from "valibot";
import type { Snippet } from "src/snippets/snippets";

export const DEFAULT_SETTINGS = {
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
    taboutExitEquationOnlyOnEOL: true,
    taboutClosingSymbols:
        "), ], \\rbrack, \\}, \\rbrace, \\rangle, \\rvert, \\rVert, \\rfloor, \\rceil, \\urcorner, }",
    autoEnlargeBrackets: true,
    autoEnlargeBracketsSpace: true,
    wordDelimiters: "., +-\\n\t:;!?\\/{}[]()=~$",
    snippetDebug: "off",

    // keys
    concealToggleKey: "",
    toggleAllFeaturesKey: "",

    // Raw settings
    autofractionExcludedEnvs: '[\n\t["^{", "}"],\n\t["\\\\pu{", "}"]\n]',
    matrixShortcutsEnvNames:
        "pmatrix, cases, align, gather, bmatrix, Bmatrix, vmatrix, Vmatrix, array, matrix",
    matrixShortcutsMacroNames: "eqnarray",
    autoEnlargeBracketsTriggers: "sum, int, frac, prod, bigcup, bigcap",
} as const satisfies LatexSuitePluginSettings & LatexSuiteRawSettings;

export type LatexSuiteKeymapSettings = v.InferInput<
    typeof latexSuiteKeymapSettingsSchema
>;

export type LatexSuitePluginSettings = {
    snippets: Array<RawSnippet | Snippet>;
    snippetVariables: SnippetVariables;
} & LatexSuiteBasicSettings &
    v.InferInput<typeof LatexSuiteRawOrParsedSettingsSchema> &
    LatexSuiteKeymapSettings;
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
