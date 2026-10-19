import { EditorView } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { Compartment, Facet, Prec, StateEffect } from "@codemirror/state";
import { processLatexSuiteSettings } from "src/settings/settings";
import { DEFAULT_SETTINGS } from "src/settings/default_settings";
import type { MappingInfo } from "src/editor_extensions/conceal_fns";
import {
    createRevealCallback,
    type Conceal,
    type Concealment,
} from "src/editor_extensions/conceal";
import type { Debouncer } from "src/editor_extensions/obsidian_utils";
import { fullMappingSchema } from "src/editor_extensions/conceal_maps";
import type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
} from "src/settings/raw_settings";

export const latexSuiteConfig = Facet.define<
    LatexSuiteCMSettings,
    LatexSuiteCMSettings
>({
    combine: (input) => {
        const settings =
            input[0] ?? processLatexSuiteSettings(DEFAULT_SETTINGS);
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
export type ConcealConfigInput = {
    concealRevealTimeout: number;
    concealLinewise: boolean;
    concealMaps: MappingInfo;
};

type ConcealConfig = {
    delayedReveal: Debouncer<[Conceal, Concealment[], EditorView], void>;
    concealLinewise: boolean;
    concealMaps: MappingInfo;
};

export const concealConfig = Facet.define<ConcealConfigInput, ConcealConfig>({
    combine: (input) => {
        const settings = input[0] ?? {
            concealRevealTimeout: 0,
            concealLinewise: false,
            concealMaps: {
                macroMap: {},
                maps: fullMappingSchema([]),
            } as MappingInfo,
        };
        const concealRevealTimeout = createRevealCallback(
            settings.concealRevealTimeout,
        );
        return {
            ...settings,
            delayedReveal: concealRevealTimeout,
        };
    },
});

export function getConcealConfig(state: EditorState) {
    return state.facet(concealConfig);
}

export function getConcealConfigExtension(pluginSettings: ConcealConfigInput) {
    return concealConfig.of(pluginSettings);
}
