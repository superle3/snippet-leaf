import type { Extension } from "@codemirror/state";
import { keymap, type EditorView, type KeyBinding } from "@codemirror/view";
import { reloadLatexSuiteFacetCompartment } from "./settings/raw_settings";
import type { LatexSuitePluginSettings } from "./settings/default_settings";
import { updateConcealEffect } from "./editor_extensions/conceal";
import { getLatexSuiteConfig } from "./snippets/codemirror/config";

const toggleConceal = (view: EditorView): boolean => {
    const currentSettings = getLatexSuiteConfig(view);
    view.dispatch({
        effects: [
            reloadLatexSuiteFacetCompartment({
                concealEnabled: !currentSettings.concealEnabled,
            }),
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
