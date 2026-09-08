import type {
    latexSuiteBasicSettingsSchema,
    latexSuiteKeymapSettingsSchema,
    LatexSuiteParsedSettingsSchema,
    LatexSuiteRawOrParsedSettingsSchema,
    LatexSuiteRawSettingsSchema,
    SettingsSchema,
    SnippetSchemaAsync,
} from "./settings";

import type { RawSnippet, SnippetVariables } from "src/snippets/parse";
import type { Snippet } from "src/snippets/snippets";
import type * as v from "valibot";

export type LatexSuitePluginSettingsExplanations = {
    [P in keyof LatexSuitePluginSettingsRaw]: {
        title: string;
        description: string;
        type: "boolean" | "string" | "array" | Array<string>;
        defaultValue: LatexSuitePluginSettingsRaw[P];
    };
};
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
