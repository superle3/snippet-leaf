import { DEFAULT_SNIPPETS } from "src/utils/default_snippets";
import { DEFAULT_SNIPPET_VARIABLES } from "src/utils/default_snippet_variables";
import type {
    LatexSuitePluginSettings,
    LatexSuiteRawSettings,
} from "./raw_settings";

export const DEFAULT_SETTINGS = {
    snippets: DEFAULT_SNIPPETS,
    snippetVariables: DEFAULT_SNIPPET_VARIABLES,

    // Basic settings
    snippetsEnabled: true,
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
    snippetRecursion: 0,

    // editor command keys
    concealToggleKey: "",
    toggleAllFeaturesKey: "",

    // Raw settings
    autofractionExcludedEnvs: '[\n\t["^{", "}"],\n\t["\\\\pu{", "}"]\n]',
    matrixShortcutsEnvNames:
        "pmatrix, cases, align, gather, bmatrix, Bmatrix, vmatrix, Vmatrix, array, matrix",
    matrixShortcutsMacroNames: "eqnarray",
    autoEnlargeBracketsTriggers: "sum, int, frac, prod, bigcup, bigcap",

    // keys
    snippetsTrigger: "Tab",
    snippetNextTabstopTrigger: "Tab",
    snippetPreviousTabstopTrigger: "Shift-Tab",
    autofractionTrigger: "/",
    matrixShortcutsCellTrigger: "Tab",
    matrixShortcutsNewlineTrigger: "Enter",
    matrixShortcutsExitTrigger: "Shift-Enter",
    taboutTrigger: "Tab",
} as const satisfies LatexSuitePluginSettings & LatexSuiteRawSettings;
