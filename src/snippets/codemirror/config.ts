import type { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import type { Facet as FacetC } from "@codemirror/state";
import type { Snippet } from "../snippets";
import type { Environment } from "../environment";
// import {
//     processLatexSuiteSettings,
//     DEFAULT_SETTINGS,
// } from "../../settings/settings";
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
    concealEnabled: boolean;
    concealRevealTimeout: number;
    colorPairedBracketsEnabled: boolean;
    highlightCursorBracketsEnabled: boolean;
    mathPreviewEnabled: boolean;
    mathPreviewPositionIsAbove: boolean;
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
    autofractionExcludedEnvs: string;
    matrixShortcutsEnvNames: string;
    autoEnlargeBracketsTriggers: string;
}

interface LatexSuiteParsedSettings {
    autofractionExcludedEnvs: Environment[];
    matrixShortcutsEnvNames: string[];
    autoEnlargeBracketsTriggers: string[];
}

export type LatexSuitePluginSettings = {
    snippets: string;
    snippetVariables: string;
} & LatexSuiteBasicSettings &
    LatexSuiteRawSettings;
export type LatexSuiteCMSettings = {
    snippets: Snippet[];
} & LatexSuiteBasicSettings &
    LatexSuiteParsedSettings;

export type LatexSuiteFacet = FacetC<
    LatexSuiteCMSettings,
    LatexSuiteCMSettings
>;
// export const latexSuiteConfig = Facet.define<
//     LatexSuiteCMSettings,
//     LatexSuiteCMSettings
// >({
//     combine: (input) => {
//         const settings =
//             input.length > 0
//                 ? input[0]
//                 : processLatexSuiteSettings([], DEFAULT_SETTINGS);
//         return settings;
//     },
// });

export function getLatexSuiteConfig(
    viewOrState: EditorView | EditorState,
    latexSuiteConfig: LatexSuiteFacet
): LatexSuiteCMSettings {
    const state = (viewOrState as EditorView).state
        ? (viewOrState as EditorView).state
        : (viewOrState as EditorState);

    return state.facet(latexSuiteConfig);
}

// export function getLatexSuiteConfigExtension(
//     pluginSettings: LatexSuiteCMSettings
// ) {
//     return latexSuiteConfig.of(pluginSettings);
// }
