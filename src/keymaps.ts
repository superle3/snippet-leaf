import type { Extension } from "@codemirror/state";
import { keymap, type EditorView, type KeyBinding } from "@codemirror/view";
import { updateConcealEffect } from "./editor_extensions/conceal";
import {
    getLatexSuiteConfig,
    reloadLatexSuiteFacetCompartment,
} from "./snippets/codemirror/config";
import type { LatexSuitePluginSettings } from "codemirror_extension/codemirror_extensions";

const toggleConceal = (view: EditorView): boolean => {
    const currentSettings = getLatexSuiteConfig(view);
    view.dispatch({
        effects: [
            reloadLatexSuiteFacetCompartment(
                {
                    concealEnabled: !currentSettings.concealEnabled,
                },
                view,
            ),
            updateConcealEffect.of(null),
        ],
    });
    return true;
};

const toggleAllFeatures = (view: EditorView): boolean => {
    const currentSettings = getLatexSuiteConfig(view);
    const featuresToToggle = [
        "snippetsEnabled",
        "autofractionEnabled",
        "matrixShortcutsEnabled",
        "taboutEnabled",
        "autoEnlargeBrackets",
    ] as const satisfies Array<keyof LatexSuitePluginSettings>;
    const on = !featuresToToggle.some((feature) => currentSettings[feature]);
    view.dispatch({
        effects: reloadLatexSuiteFacetCompartment(
            featuresToToggle.reduce((acc, feature) => {
                acc[feature] = on;
                return acc;
            }, {} as Partial<LatexSuitePluginSettings>),
            view,
        ),
    });
    return true;
};

export const getKeymaps = (settings: LatexSuitePluginSettings): Extension => {
    const keymaps: KeyBinding[] = [];
    if (settings.concealToggleKey) {
        keymaps.push({
            key: settings.concealToggleKey,
            run: toggleConceal,
        });
    }
    if (settings.toggleAllFeaturesKey) {
        keymaps.push({
            key: settings.toggleAllFeaturesKey,
            run: toggleAllFeatures,
        });
    }
    return keymap.of(keymaps);
};
