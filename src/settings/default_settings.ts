import { DEFAULT_SNIPPETS } from "src/utils/default_snippets";
import { DEFAULT_SNIPPET_VARIABLES } from "src/utils/default_snippet_variables";
import type {
    RawSnippet,
    Snippet,
    SnippetVariables,
} from "codemirror_extension/codemirror_extensions";
import type { Environment } from "src/snippets/environment";
import { SnippetType } from "src/snippets/snippets";
import * as v from "valibot";
import { parseSnippet, RawSnippetSchema } from "src/snippets/parse";
import json5 from "json5";
import { sortSnippets } from "src/snippets/sort";
import snippets from "src/default_snippets";

export const DEFAULT_SETTINGS: LatexSuitePluginSettings &
    LatexSuiteRawSettings = {
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
    autoEnlargeBrackets: true,
    wordDelimiters: "., +-\\n\t:;!?\\/{}[]()=~$",

    // Raw settings
    autofractionExcludedEnvs: '[\n\t["^{", "}"],\n\t["\\\\pu{", "}"]\n]',
    matrixShortcutsEnvNames:
        "pmatrix, cases, align, gather, bmatrix, Bmatrix, vmatrix, Vmatrix, array, matrix",
    autoEnlargeBracketsTriggers: "sum, int, frac, prod, bigcup, bigcap",
} as const;

export type LatexSuitePluginSettings = {
    snippets: Array<RawSnippet | Snippet>;
    snippetVariables: SnippetVariables;
} & LatexSuiteBasicSettings &
    (LatexSuiteRawSettings | LatexSuiteParsedSettings); /**
 * Settings that require further processing (e.g. conversion to an array) before being used.
 */

export interface LatexSuiteRawSettings {
    autofractionExcludedEnvs: string;
    matrixShortcutsEnvNames: string;
    autoEnlargeBracketsTriggers: string;
}
const latexSuiteBasicSettingsSchema = v.object({
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
} satisfies { [key in keyof LatexSuiteBasicSettings]: any });
type NestedRawSnippetArray = Array<RawSnippet | NestedRawSnippetArray>;

const NestedRawSnippetArraySchema: v.GenericSchema<NestedRawSnippetArray> =
    v.lazy(() =>
        v.array(v.union([RawSnippetSchema, NestedRawSnippetArraySchema])),
    );

async function importString(
    source: string,
    identifier: string = "snippets.js",
) {
    const blob = new Blob([source], { type: "text/javascript" });
    const file = new File([blob], identifier, { type: "text/javascript" });
    const url = URL.createObjectURL(file);
    const module = await import(url);
    return module;
}

async function importSnippets(source: string): Promise<unknown> {
    const module_default = await importString(source, "snippets.js");
    if (module_default.default) return module_default.default;
    const module = await importString(
        "export default " + source,
        "snippets_with_export.js",
    );
    return module.default;
}

const UnParsedSnippetSnippetVariablesSchema = v.pipe(
    v.string(),
    v.transform((str): unknown => json5.parse(str)),
);
const SnippetSchema = v.union([v.string(), NestedRawSnippetArraySchema]);
const SnippetVariablesSchema = v.pipe(
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

const SnippetSchemaSync = v.pipe(
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
        return sortSnippets(parsed_snippets);
    }),
);

const SnippetSchemaAsync = v.pipeAsync(
    v.objectAsync({
        snippets: v.pipeAsync(
            v.string(),
            v.transform(importSnippets),
            v.awaitAsync(),
        ),
        snippetVariables: SnippetVariablesSchema,
        version: v.optional(v.union([v.literal(1), v.literal(2)]), 2),
    }),
    //@ts-expect-error typescript/valibot not working
    SnippetSchemaSync,
);
const SettingsSchema = v.pipe(
    v.intersect([latexSuiteBasicSettingsSchema]),
);

type SnippetSchemaInput = v.InferOutput<typeof SnippetSchema>;
export interface LatexSuiteBasicSettings {
    snippetsEnabled: boolean;
    snippetsTrigger: "Tab" | " ";
    defaultSnippetVersion: 1 | 2;
    suppressSnippetTriggerOnIME: boolean;
    removeSnippetWhitespace: boolean;
    autoDelete$: boolean;
    concealEnabled: boolean;
    concealRevealTimeout: number;
    concealLinewise: boolean;
    colorPairedBracketsEnabled: boolean;
    highlightCursorBracketsEnabled: boolean;
    autofractionEnabled: boolean;
    autofractionSymbol: string;
    autofractionBreakingChars: string;
    matrixShortcutsEnabled: boolean;
    taboutEnabled: boolean;
    autoEnlargeBrackets: boolean;
    wordDelimiters: string;
}
export interface LatexSuiteParsedSettings {
    autofractionExcludedEnvs: Environment[];
    matrixShortcutsEnvNames: string[];
    autoEnlargeBracketsTriggers: string[];
}
export type LatexSuiteCMSettings = {
    snippets: Snippet<SnippetType>[];
    snippetVariables: SnippetVariables;
} & LatexSuiteBasicSettings &
    LatexSuiteParsedSettings;
export type LatexSuitePluginSettingsRaw = {
    snippets: string;
    snippetVariables: string;
} & LatexSuiteBasicSettings &
    LatexSuiteRawSettings;
