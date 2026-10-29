import json5 from "json5";
import type { NestedArray } from "./settings";
import { MappingSchema } from "src/editor_extensions/conceal_maps";
import {
    RawSnippetSchema,
    parseSnippet,
    type SnippetVariables,
} from "src/snippets/parse";
import { sortSnippets } from "src/snippets/sort";
import * as v from "valibot";
import { serializeSnippetLike } from "src/snippets/snippets";

export const parseJson5Schema = v.pipe(
    v.string(),
    v.transform((str): unknown => json5.parse(str)),
);

export const MapsSchema = v.object({
    concealMaps: v.pipe(v.string(), parseJson5Schema, MappingSchema),
});

export const SnippetDebugLevelSchema = v.union([
    v.literal("off"),
    v.literal("info"),
    v.literal("verbose"),
]);
export const StrToArraySchema = v.union([
    v.pipe(
        v.string(),
        v.transform((str) => str.replace(/\s/g, "").split(",")),
    ),
]);

export const NestedRawSnippetArraySchema: v.GenericSchema<NestedArray<object>> =
    v.lazy(() =>
        v.array(v.union([v.looseObject({}), NestedRawSnippetArraySchema])),
    );

export const SnippetVariablesSchema = v.pipe(
    v.union([
        v.pipe(parseJson5Schema, v.record(v.string(), v.string())),
        v.record(v.string(), v.string()),
    ]),
    v.transform((rawSnippetVariables: Record<string, string>) => {
        const snippetVariables: SnippetVariables = {};
        for (const [variable, value] of Object.entries(rawSnippetVariables)) {
            if (variable.startsWith("${")) {
                if (!variable.endsWith("}")) {
                    throw `Invalid snippet variable name '${variable}': Starts with '\${' but does not end with '}'. You need to have both or neither.`;
                }
                snippetVariables[variable as `$\{${string}}`] = value;
            } else {
                if (variable.endsWith("}")) {
                    throw `Invalid snippet variable name '${variable}': Ends with '}' but does not start with '\${'. You need to have both or neither.`;
                }
                snippetVariables[("${" + variable + "}") as `$\{${string}}`] =
                    value;
            }
        }
        return snippetVariables;
    }),
);

export const SnippetSchemaAsync = v.pipeAsync(
    v.objectAsync({
        snippets: v.pipeAsync(
            v.string(),
            v.transform(importSnippets),
            v.awaitAsync(),
        ),
        snippetVariables: v.pipe(
            v.string(),
            parseJson5Schema,
            SnippetVariablesSchema,
        ),
        version: v.optional(v.union([v.literal(1), v.literal(2)]), 2),
    }),
    v.transform((obj) => v.parse(SnippetSchemaSync, obj)),
);
export const SnippetSchemaSync = v.pipe(
    v.object({
        snippets: v.pipe(
            NestedRawSnippetArraySchema,
            v.transform((arr) => arr.flat(<20>Infinity)),
            v.array(RawSnippetSchema),
        ),
        snippetVariables: SnippetVariablesSchema,
        version: v.optional(v.union([v.literal(1), v.literal(2)]), 2),
    }),
    v.transform(({ snippets, snippetVariables, version }) => {
        const parsed_snippets = snippets.flatMap((raw) => {
            try {
                // Normalize the raw snippet and convert it into a Snippet
                return parseSnippet(raw, snippetVariables, version);
            } catch (err) {
                const e = err as Error;
                // provide context of which snippet errored
                throw new Error(
                    `\n${e}\nErroring snippet:\n${serializeSnippetLike(raw)}`,
                );
            }
        });
        return { snippets: sortSnippets(parsed_snippets), snippetVariables };
    }),
);
export const latexSuiteKeymapSettingsSchema = v.object({
    concealToggleKey: v.string(),
    toggleAllFeaturesKey: v.string(),
    snippetsTrigger: v.string(),
    snippetNextTabstopTrigger: v.string(),
    snippetPreviousTabstopTrigger: v.string(),
    taboutTrigger: v.string(),
    reverseTaboutTrigger: v.string(),
    matrixShortcutsNewlineTrigger: v.string(),
    matrixShortcutsCellTrigger: v.string(),
    matrixShortcutsExitTrigger: v.string(),
    autofractionTrigger: v.string(),
});
export const latexSuiteBasicSettingsSchema = v.object({
    snippetsEnabled: v.boolean(),
    defaultSnippetVersion: v.union([v.literal(1), v.literal(2)]),
    suppressSnippetTriggerOnIME: v.boolean(),
    removeSnippetWhitespace: v.boolean(),
    autoDelete$: v.boolean(),
    concealEnabled: v.boolean(),
    concealRevealTimeout: v.number(),
    concealLinewise: v.boolean(),
    colorPairedBracketsEnabled: v.boolean(),
    highlightCursorBracketsEnabled: v.boolean(),
    autofractionEnabled: v.boolean(),
    autofractionSymbol: v.string(),
    autofractionBreakingChars: v.string(),
    matrixShortcutsEnabled: v.boolean(),
    taboutEnabled: v.boolean(),
    taboutExitEquationOnlyOnEOL: v.boolean(),
    autoEnlargeBrackets: v.boolean(),
    autoEnlargeBracketsSpace: v.boolean(),
    wordDelimiters: v.string(),
    snippetDebug: SnippetDebugLevelSchema,
    snippetRecursion: v.number(),
    snippetIMEVersion: v.boolean(),
});
export async function importSnippets(source: string): Promise<unknown> {
    const module_default = await importString(source, "snippets.js");
    if (module_default.default) return module_default.default;
    const module = await importString(
        "export default " + source,
        "snippets_with_export.js",
    );
    return module.default;
}
export async function importString(
    source: string,
    identifier: string = "snippets.js",
) {
    const blob = new Blob([source], { type: "text/javascript" });
    const file = new File([blob], identifier, { type: "text/javascript" });
    const url = URL.createObjectURL(file);
    const module = await import(/* @vite-ignore */ url);
    return module;
}
export const LatexSuiteRawSettingsSchema = v.object({
    autofractionExcludedEnvs: v.pipe(
        v.string(),
        v.parseJson(),
        v.array(
            v.pipe(
                v.tuple([v.string(), v.string()]),
                v.transform(([openSymbol, closeSymbol]) => ({
                    openSymbol,
                    closeSymbol,
                })),
            ),
        ),
    ),
    matrixShortcutsEnvNames: StrToArraySchema,
    matrixShortcutsMacroNames: StrToArraySchema,
    autoEnlargeBracketsTriggers: StrToArraySchema,
    taboutClosingSymbols: v.pipe(
        StrToArraySchema,
        v.transform((arr) => new Set(arr)),
    ),
    textMacros: v.string(),
    concealMaps: v.pipe(v.string(), parseJson5Schema, MappingSchema),
});

export const SettingsSchemaWithoutSnippets = v.intersectAsync([
    latexSuiteBasicSettingsSchema,
    latexSuiteKeymapSettingsSchema,
    LatexSuiteRawSettingsSchema,
]);

export const SnippetSchema = v.unionAsync([
    SnippetSchemaAsync,
    SnippetSchemaSync,
]);
export const SettingsSchema = v.intersectAsync([
    latexSuiteBasicSettingsSchema,
    latexSuiteKeymapSettingsSchema,
    LatexSuiteRawSettingsSchema,
    SnippetSchema,
    MapsSchema,
]);
