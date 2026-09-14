import { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { Compartment, Facet, Prec, StateEffect } from "@codemirror/state";
import { processLatexSuiteSettings } from "src/settings/settings";
import type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
} from "codemirror_extension/codemirror_extensions";
import { DEFAULT_SETTINGS } from "src/settings/default_settings";

const latexSuiteConfig = Facet.define<
    LatexSuiteCMSettings,
    LatexSuiteCMSettings
>({
    combine: (input) => {
        const settings =
            input.length > 0
                ? input[0]
                : processLatexSuiteSettings(DEFAULT_SETTINGS);
        return settings;
    },
});

export function getLatexSuiteConfig(viewOrState: EditorView | EditorState) {
    const state =
        viewOrState instanceof EditorView ? viewOrState.state : viewOrState;

    return state.facet(latexSuiteConfig);
}

export function getLatexSuiteConfigExtension(
    pluginSettings: LatexSuiteCMSettings,
) {
    return latexSuiteConfig.of(pluginSettings);
}

const settingsCompartment = new Compartment();
export function reloadLatexSuiteFacetCompartment(
    settings: Partial<LatexSuitePluginSettings>,
    view: EditorView,
) {
    const old_settings = getLatexSuiteConfig(view);
    const newSettings = Object.assign({}, old_settings, settings);
    const oldExtension = settingsCompartment.get(view.state);
    const settingsExtension = Prec.high(
        getLatexSuiteConfigExtension(newSettings),
    );
    if (oldExtension) {
        return settingsCompartment.reconfigure(settingsExtension);
    } else {
        return StateEffect.appendConfig.of([
            settingsCompartment.of(settingsExtension),
        ]);
    }
}
