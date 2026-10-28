/// <reference types="node" />
import { readFileSync } from "fs";
import type { DEFAULT_SETTINGS } from "../src/settings/default_settings";

const key_record = {
    autoDelete$: true,
    concealEnabled: true,
    concealLinewise: true,
    concealMaps: true,
    colorPairedBracketsEnabled: true,
    highlightCursorBracketsEnabled: true,
    autofractionEnabled: true,
    autofractionSymbol: true,
    autofractionBreakingChars: true,
    matrixShortcutsEnabled: true,
    taboutEnabled: true,
    taboutExitEquationOnlyOnEOL: true,
    taboutClosingSymbols: true,
    autoEnlargeBrackets: true,
    autoEnlargeBracketsSpace: true,
    wordDelimiters: true,
    snippetDebug: true,
    snippetRecursion: true,

    // editor command keys
    concealToggleKey: true,
    toggleAllFeaturesKey: true,
    autoEnlargeBracketsTriggers: true,
    matrixShortcutsEnvNames: true,
    matrixShortcutsMacroNames: true,
    autofractionExcludedEnvs: true,
    snippetsEnabled: true,
    defaultSnippetVersion: true,
    suppressSnippetTriggerOnIME: true,
    removeSnippetWhitespace: true,
    autofractionTrigger: true,
    snippets: true,
    snippetVariables: true,
    snippetIMEVersion: true,
    concealRevealTimeout: true,
    matrixShortcutsCellTrigger: true,
    snippetsTrigger: true,
    snippetNextTabstopTrigger: true,
    snippetPreviousTabstopTrigger: true,
    matrixShortcutsExitTrigger: true,
    matrixShortcutsNewlineTrigger: true,
    reverseTaboutTrigger: true,
    taboutTrigger: true,
    textMacros: true,
} satisfies { [K in keyof typeof DEFAULT_SETTINGS]: boolean };
const settings_tab = readFileSync(
    "browser_extension/settings/settings_tab.ts",
    "utf-8",
);

for (const key of Object.keys(key_record)) {
    if (!settings_tab.includes(key)) {
        console.error(`Missing setting key in settings_tab.ts: ${key}`);
    }
}
