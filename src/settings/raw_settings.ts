import type { LatexSuiteFacet } from "./settings";
import { processLatexSuiteSettings } from "./settings";
import type { LatexSuitePluginSettingsRaw } from "./default_settings";
import type { LatexSuiteCMSettings } from "./default_settings";
import type { LatexSuitePluginSettings } from "./default_settings";
import type { EditorState } from "@codemirror/state";
import { Compartment } from "@codemirror/state";
import type { Compartment as CompartmentC } from "@codemirror/state";

import { Facet } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

let latexSuiteConfig: LatexSuiteFacet;
let latexSuiteConfigCompartment: CompartmentC;

export function setLatexSuiteConfig(CMSettings: LatexSuitePluginSettings) {
    latexSuiteConfig = Facet.define<
        Partial<LatexSuitePluginSettings>,
        LatexSuiteCMSettings
    >({
        combine: (
            input: readonly Partial<LatexSuitePluginSettings>[],
        ): LatexSuiteCMSettings => {
            const settings =
                input.length > 0
                    ? processLatexSuiteSettings(
                          Object.assign({}, CMSettings, ...input),
                      )
                    : processLatexSuiteSettings(CMSettings);
            return settings;
        },
    });
    latexSuiteConfigCompartment = new Compartment();
    return latexSuiteConfigCompartment.of(latexSuiteConfig.of({}));
}

export function reloadLatexSuiteFacetCompartment(
    settings: Partial<LatexSuitePluginSettings>,
) {
    return latexSuiteConfigCompartment.reconfigure(
        latexSuiteConfig.of(settings),
    );
}

export function getLatexSuiteConfig(
    viewOrState: EditorView | EditorState,
): LatexSuiteCMSettings {
    // @ts-expect-error Property 'state' does not exist on type 'EditorState | EditorView'.
    return (viewOrState.state ?? viewOrState).facet(latexSuiteConfig);
}
export type LatexSuitePluginSettingsExplanations = {
    [P in keyof LatexSuitePluginSettingsRaw]: {
        title: string;
        description: string;
        type: "boolean" | "string" | "array" | Array<string>;
        defaultValue: LatexSuitePluginSettingsRaw[P];
    };
};
