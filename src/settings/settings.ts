import { ARE_SETTINGS_PARSED } from "../snippets/snippets";
import type { Environment } from "../snippets/environment";
import {
    parseSnippetsSync,
    type InputRawSnippet,
    type SnippetVariables,
} from "src/snippets/parse";
import type { Facet } from "@codemirror/state";
import type { LatexSuiteCMSettings, MathlessMacros } from "./raw_settings";
import type { LatexSuitePluginSettings } from "./raw_settings";
import * as v from "valibot";
import { createMacroMap } from "src/editor_extensions/conceal_fns";
import {
    type RawConcealMapping,
    EMPTY_MAPPING,
    MappingSchema,
    ParsedMappingSchema,
    fullMappingSchema,
} from "src/editor_extensions/conceal_maps";
import {
    EMPTY_MATHLESS_ARGS,
    mathlessArgsSchema,
    restrictedMacroArgs,
    textMacroArgs,
} from "src/editor_context/default_text_areas";
import type { SnippetDebugLevelSchema } from "./setting_schemas";
import {
    LatexSuiteRawSettingsSchema,
    parseJson5Schema,
} from "./setting_schemas";

function validateTextMacros(textMacros: string) {
    return v.safeParse(
        v.pipe(
            v.string(),
            parseJson5Schema,
            v.check(
                (obj) => !Array.isArray(obj),
                "Expected an object with 'text' and 'restricted' properties, but got an array.",
            ),
            mathlessArgsSchema,
        ),
        textMacros,
    );
}

function strToArray(str: string | string[] | Set<string>) {
    return Array.isArray(str)
        ? str.map((s) => s.replace(/\s/g, ""))
        : str instanceof Set
          ? Array.from(str)
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

function _getConcealMaps(
    concealMapsStr: LatexSuitePluginSettings["concealMaps"],
): RawConcealMapping {
    const schema =
        typeof concealMapsStr === "string"
            ? v.pipe(v.string(), v.parseJson(), MappingSchema)
            : MappingSchema;
    try {
        return v.parse(schema, concealMapsStr);
    } catch (e) {
        console.error(e);
        return EMPTY_MAPPING;
    }
}

function getMacroAreasFromString(str: string) {
    const result = validateTextMacros(str);
    if (!result.success) {
        console.error(
            "Failed to parse textMacros/snippetlessMacros",
            result.issues,
        );
    }
    const data = result.success ? result.output : EMPTY_MATHLESS_ARGS;
    return {
        text: [...data.text, ...textMacroArgs],
        restricted: [...data.restricted, ...restrictedMacroArgs],
    };
}

export function processLatexSuiteSettings(
    settings: LatexSuitePluginSettings,
): LatexSuiteCMSettings {
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
            ) as InputRawSnippet[],
            snippetVariables,
            settings.defaultSnippetVersion,
        ),
    ];

    const groupedSnippets = {
        automatic: snippets.filter((s) => s.options.automatic),
        all: snippets,
    };

    const concealMaps = fullMappingSchema([
        _getConcealMaps(settings.concealMaps),
    ]);
    const mappingInfo = {
        maps: concealMaps,
        macroMap: createMacroMap(concealMaps),
    };

    const textMacros = getMacroAreasFromString(settings.textMacros);
    const mathlessMacros: MathlessMacros = {
        text: textMacros.text,
        restricted: textMacros.restricted,
        all: [
            ...textMacros.text.map((m) => ({ ...m, kind: "text" }) as const),
            ...textMacros.restricted.map(
                (m) => ({ ...m, kind: "restricted" }) as const,
            ),
        ],
    };

    return {
        ...settings,

        // Override raw settings with parsed settings
        snippets: groupedSnippets,
        concealMaps: mappingInfo,
        snippetVariables,
        autofractionExcludedEnvs: getAutofractionExcludedEnvs(
            settings.autofractionExcludedEnvs,
        ),
        matrixShortcutsEnvNames: strToArray(settings.matrixShortcutsEnvNames),
        matrixShortcutsMacroNames: strToArray(
            settings.matrixShortcutsMacroNames,
        ),
        autoEnlargeBracketsTriggers: strToArray(
            settings.autoEnlargeBracketsTriggers,
        ),
        taboutClosingSymbols: new Set(
            strToArray(settings.taboutClosingSymbols),
        ),
        mathlessMacros: mathlessMacros,
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
export const LatexSuiteParsedSettingsSchema = v.object({
    autofractionExcludedEnvs: v.array(EnvironmentSchema),
    matrixShortcutsEnvNames: v.array(v.string()),
    matrixShortcutsMacroNames: v.array(v.string()),
    autoEnlargeBracketsTriggers: v.array(v.string()),
    taboutClosingSymbols: v.set(v.string()),
    concealMaps: ParsedMappingSchema,
    textMacros: v.string(),
});

export const LatexSuiteRawOrParsedSettingsSchema = v.union([
    LatexSuiteRawSettingsSchema,
    LatexSuiteParsedSettingsSchema,
]);

export type snippetDebugLevel = v.InferOutput<typeof SnippetDebugLevelSchema>;
export type NestedArray<T> = Array<T | NestedArray<T>>;
