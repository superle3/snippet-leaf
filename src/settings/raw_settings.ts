import type { UpdateHandler } from "src/api";
import type { MappingInfo } from "src/editor_extensions/conceal_fns";
import type {
    LatexSuiteParsedSettingsSchema,
    LatexSuiteRawOrParsedSettingsSchema,
} from "./settings";
import type { LatexSuiteRawSettingsSchema } from "./setting_schemas";
import type { latexSuiteBasicSettingsSchema } from "./setting_schemas";
import type { latexSuiteKeymapSettingsSchema } from "./setting_schemas";
import type { SettingsSchemaWithoutSnippets } from "./setting_schemas";
import type { SnippetSchemaAsync } from "./setting_schemas";
import type { SettingsSchema } from "./setting_schemas";

import type { InputRawSnippet, SnippetVariables } from "src/snippets/parse";
import type { Snippet } from "src/snippets/snippets";
import type * as v from "valibot";
import type { MacroArgs } from "src/editor_context/default_text_areas";
import type { RawConcealMapping } from "src/editor_extensions/conceal_maps";

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
    snippets: Array<InputRawSnippet | Snippet>;
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
export type LatexSuiteIntermediateSettings = v.InferOutput<
    typeof SettingsSchema
>;
export type LatexSuitePluginSettingsRaw = v.InferInput<typeof SettingsSchema> &
    v.InferInput<typeof SnippetSchemaAsync> &
    v.InferInput<typeof LatexSuiteRawSettingsSchema>;

export type MathlessMacros = {
    text: MacroArgs[];
    restricted: MacroArgs[];
    all: (MacroArgs & { kind: "text" | "restricted" })[];
};

export type GroupedSnippets = {
    automatic: Snippet[];
    all: Snippet[];
};

export interface LatexSuiteProcessedSchemaSettings {
    snippets: GroupedSnippets;
    snippetVariables: SnippetVariables;
    concealMaps: MappingInfo;
    mathlessMacros: MathlessMacros;
}

export type LatexSuiteCMSettings = Omit<
    v.InferOutput<typeof SettingsSchemaWithoutSnippets>,
    "concealMaps"
> &
    LatexSuiteProcessedSchemaSettings;

export interface LatexSuiteParsedSchemaSettings {
    rawConcealMaps: RawConcealMapping[];
    updateHandlers: UpdateHandler[];
}
