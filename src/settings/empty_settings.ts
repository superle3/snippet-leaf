import type {
    LatexSuitePluginSettings,
    LatexSuiteRawSettings,
} from "./default_settings";

export const EMPTY_SETTINGS: LatexSuitePluginSettings & LatexSuiteRawSettings =
    {
        snippets: [],
        snippetVariables: {},

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
        colorPairedBracketsEnabled: false,
        highlightCursorBracketsEnabled: false,
        autofractionEnabled: false,
        autofractionSymbol: "",
        autofractionBreakingChars: "",
        matrixShortcutsEnabled: false,
        taboutEnabled: false,
        autoEnlargeBrackets: false,
        wordDelimiters: "",

        // Raw settings
        autofractionExcludedEnvs: "",
        matrixShortcutsEnvNames: "",
        autoEnlargeBracketsTriggers: "",
    } as const;
