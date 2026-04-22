import { ARE_SETTINGS_PARSED, type Snippet } from "../snippets/snippets";
import type { Environment } from "../snippets/environment";
import {
    parseSnippet,
    parseSnippetsSync,
    RawSnippetSchema,
    type RawSnippet,
    type SnippetVariables,
} from "src/snippets/parse";
import type { Facet } from "@codemirror/state";
import type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
} from "./default_settings";
import * as v from "valibot";
import { sortSnippets } from "src/snippets/sort";
import json5 from "json5";

export function processLatexSuiteSettings(
    settings: LatexSuitePluginSettings & {
        snippets: Array<RawSnippet | Snippet>;
        snippetVariables: Record<string, string>;
    },
): LatexSuiteCMSettings {
    function strToArray(str: string | string[]) {
        return Array.isArray(str)
            ? str.map((s) => s.replace(/\s/g, ""))
            : str.replace(/\s/g, "").split(",");
    }

    function getAutofractionExcludedEnvs(
        envsStr: string | Environment[],
    ): Environment[] {
        if (Array.isArray(envsStr)) {
            for (const env of envsStr) {
                if (
                    typeof env !== "object" ||
                    !("openSymbol" in env) ||
                    !("closeSymbol" in env)
                ) {
                    throw new Error(
                        "Invalid environment format in autofractionExcludedEnvs. Expected an array of objects with openSymbol and closeSymbol properties.",
                    );
                }
            }
            return envsStr as Environment[];
        }
        let envs = [];

        try {
            const envsJSON = JSON.parse(envsStr);
            envs = envsJSON.map(function (env: string[]) {
                return { openSymbol: env[0], closeSymbol: env[1] };
            });
        } catch (e) {
            console.log(e);
        }

        return envs;
    }
    const snippetVariables = validateSnippetVariables(
        settings.snippetVariables,
    );
    const snippets = [
        ...settings.snippets.filter(
            (snippet) => ARE_SETTINGS_PARSED in snippet,
        ),
        ...parseSnippetsSync(
            settings.snippets.filter(
                (snippet) => !(ARE_SETTINGS_PARSED in snippet),
            ) as RawSnippet[],
            snippetVariables,
        ),
    ];
    return {
        ...settings,

        // Override raw settings with parsed settings
        snippets,
        snippetVariables,
        autofractionExcludedEnvs: getAutofractionExcludedEnvs(
            settings.autofractionExcludedEnvs,
        ),
        matrixShortcutsEnvNames: strToArray(settings.matrixShortcutsEnvNames),
        autoEnlargeBracketsTriggers: strToArray(
            settings.autoEnlargeBracketsTriggers,
        ),
    };
}
export type LatexSuiteFacet = Facet<
    Partial<LatexSuitePluginSettings>,
    LatexSuiteCMSettings
>;

function validateSnippetVariables(
    snippetVariables: Record<string, string>,
): SnippetVariables {
    for (const [key, value] of Object.entries(snippetVariables)) {
        if (typeof value !== "string") {
            throw new Error(
                `Invalid snippet variable value: ${value}. Value must be strings.`,
            );
        }
        if (
            !(
                typeof key === "string" &&
                key.startsWith("${") &&
                key.endsWith("}")
            )
        ) {
            throw new Error(
                `Invalid snippet variable key: ${key}. Keys must be enclosed in \${}.`,
            );
        }
    }
    return snippetVariables;
}
export const EnvironmentSchema = v.object({
    openSymbol: v.string(),
    closeSymbol: v.string(),
});
export const StrToArraySchema = v.union([
    v.pipe(
        v.string(),
        v.transform((str) => str.replace(/\s/g, "").split(",")),
    ),
]);
export const LatexSuiteParsedSettingsSchema = v.object({
    autofractionExcludedEnvs: v.array(EnvironmentSchema),
    matrixShortcutsEnvNames: v.array(v.string()),
    autoEnlargeBracketsTriggers: v.array(v.string()),
});
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
    autoEnlargeBracketsTriggers: StrToArraySchema,
});
export const LatexSuiteRawOrParsedSettingsSchema = v.union([
    LatexSuiteRawSettingsSchema,
    LatexSuiteParsedSettingsSchema,
]);
export const latexSuiteBasicSettingsSchema = v.object({
    snippetsEnabled: v.boolean(),
    snippetsTrigger: v.union([v.literal("Tab"), v.literal(" ")]),
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
    autoEnlargeBrackets: v.boolean(),
    wordDelimiters: v.string(),
});
export type NestedRawSnippetArray = Array<RawSnippet | NestedRawSnippetArray>;
export const NestedRawSnippetArraySchema: v.GenericSchema<NestedRawSnippetArray> =
    v.lazy(() =>
        v.array(v.union([RawSnippetSchema, NestedRawSnippetArraySchema])),
    );
export async function importString(
    source: string,
    identifier: string = "snippets.js",
) {
    const blob = new Blob([source], { type: "text/javascript" });
    const file = new File([blob], identifier, { type: "text/javascript" });
    const url = URL.createObjectURL(file);
    const module = await import(url);
    return module;
}
export async function importSnippets(source: string): Promise<unknown> {
    const module_default = await importString(source, "snippets.js");
    if (module_default.default) return module_default.default;
    const module = await importString(
        "export default " + source,
        "snippets_with_export.js",
    );
    return module.default;
}
export const UnParsedSnippetSnippetVariablesSchema = v.pipe(
    v.string(),
    v.transform((str): unknown => json5.parse(str)),
);
export const SnippetVariablesSchema = v.pipe(
    v.union([
        v.pipe(
            UnParsedSnippetSnippetVariablesSchema,
            v.record(v.string(), v.string()),
        ),
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
        const parsed_snippets = snippets.map((raw) => {
            return parseSnippet(raw, snippetVariables, version);
        });
        return { snippets: sortSnippets(parsed_snippets), snippetVariables };
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
            UnParsedSnippetSnippetVariablesSchema,
            SnippetVariablesSchema,
        ),
        version: v.optional(v.union([v.literal(1), v.literal(2)]), 2),
    }),
    v.transform((obj) => v.parse(SnippetSchemaSync, obj)),
);
export const SnippetSchema = v.unionAsync([
    SnippetSchemaAsync,
    SnippetSchemaSync,
]);
export const SettingsSchema = v.intersectAsync([
    latexSuiteBasicSettingsSchema,
    LatexSuiteRawSettingsSchema,
    SnippetSchema,
]);
