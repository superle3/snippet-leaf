import { DEFAULT_SNIPPETS_str } from "src/utils/default_snippets";
import { DEFAULT_SETTINGS } from "./default_settings";
import type { LatexSuitePluginSettingsExplanations } from "./raw_settings";
import { DEFAULT_SNIPPET_VARIABLES_str } from "src/utils/default_snippet_variables";

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
        title: "Auto enlarge brackets",
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
        title: "Excluded autofraction environments",
        description:
            'A list of environments to exclude auto-fraction from running in. For example, to exclude auto-fraction from running while inside an exponent, such as e^{...}, use  ["^{", "}"]',
        type: "string",
        defaultValue: DEFAULT_SETTINGS.autofractionExcludedEnvs,
    },
    matrixShortcutsEnvNames: {
        title: "Matrix environments",
        description:
            "A list of environment names to run the matrix shortcuts in, separated by commas.",
        type: "string",
        defaultValue: DEFAULT_SETTINGS.matrixShortcutsEnvNames,
    },
    autoEnlargeBracketsTriggers: {
        title: "Auto enlarge bracket triggers",
        description:
            'A list of triggers that will cause brackets to be automatically enlarged. e.g. ["sum", "int", "frac"]',
        type: "string",
        defaultValue: DEFAULT_SETTINGS.autoEnlargeBracketsTriggers,
    },
    concealEnabled: {
        title: "Conceal enabled",
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
    concealLinewise: {
        title: "Conceal linewise",
        description:
            "Whether to reveal entire lines when the cursor is on that line. If false, only LaTeX directly beneath the cursor is revealed.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.concealLinewise,
    },
    colorPairedBracketsEnabled: {
        title: "Color paired brackets",
        description: "Whether to colorize matching brackets.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.colorPairedBracketsEnabled,
    },
    highlightCursorBracketsEnabled: {
        title: "Highlight matching bracket beneath cursor",
        description:
            "When the cursor is adjacent to a bracket, highlight the matching bracket.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.highlightCursorBracketsEnabled,
    },
    defaultSnippetVersion: {
        title: "Default snippet version",
        description:
            "The default snippet version to use for the snippet syntax. Version 2 is recommended for most users.",
        type: ["1", "2"],
        defaultValue: DEFAULT_SETTINGS.defaultSnippetVersion,
    },
} as const;
