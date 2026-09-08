import { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { Compartment, Facet } from "@codemirror/state";
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

const settingsCompartment = new Compartment();
export function getLatexSuiteConfigExtension(
    pluginSettings: LatexSuiteCMSettings,
) {
    return settingsCompartment.of(latexSuiteConfig.of(pluginSettings));
}

export function reloadLatexSuiteFacetCompartment(
    settings: Partial<LatexSuitePluginSettings>,
    view: EditorView,
) {
    const old_settings = getLatexSuiteConfig(view);
    const newSettings = Object.assign({}, old_settings, settings);
    return settingsCompartment.reconfigure(latexSuiteConfig.of(newSettings));
}
