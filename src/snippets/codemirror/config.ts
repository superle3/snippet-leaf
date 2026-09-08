import { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { Facet } from "@codemirror/state";
import { processLatexSuiteSettings } from "src/settings/settings";
import type { LatexSuiteCMSettings } from "codemirror_extension/codemirror_extensions";
import { DEFAULT_SETTINGS } from "codemirror_extension/codemirror_extensions";

export const latexSuiteConfig = Facet.define<
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
