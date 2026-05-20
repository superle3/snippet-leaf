import type {
    EditorSelection as EditorSelectionC,
    Extension as ExtensionC,
    StateEffect as StateEffectC,
    StateField as StateFieldC,
    Prec as PrecC,
    Facet as FacetC,
    RangeSet as RangeSetC,
    RangeValue as RangeValueC,
    RangeSetBuilder as RangeSetBuilderC,
    ChangeSet as ChangeSetC,
    Compartment as CompartmentC,
} from "@codemirror/state";
import type {
    undo as undoC,
    redo as redoC,
    isolateHistory as isolateHistoryC,
    invertedEffects as invertedEffectsC,
} from "@codemirror/commands";
import type {
    Decoration as DecorationC,
    EditorView as EditorViewC,
    KeyBinding as KeyBindingC,
    ViewPlugin as ViewPluginC,
    ViewUpdate as ViewUpdateC,
    WidgetType as WidgetTypeC,
    hoverTooltip as hoverTooltipC,
} from "@codemirror/view";
import type { syntaxTree as syntaxTreeC } from "@codemirror/language";
import type {
    CodeMirror as CodeMirrorVimC,
    Vim as VimC,
    getCM as getCMC,
} from "@replit/codemirror-vim";
import * as v from "valibot";

import { main } from "../src/extension";
import {
    RangeSet,
    RangeSetBuilder,
    RangeValue,
} from "./codemirror_range_objects";
import type {
    LatexSuiteCMSettings,
    LatexSuitePluginSettings,
} from "src/settings/default_settings";
import { SettingsSchema } from "src/settings/settings";
import type { LatexSuiteFacet } from "src/settings/settings";
import { EMPTY_SETTINGS } from "src/settings/empty_settings";

type CodeMirrorExt = {
    Decoration: typeof DecorationC;
    EditorSelection: typeof EditorSelectionC;
    EditorView: typeof EditorViewC;
    Prec: typeof PrecC;
    StateField: typeof StateFieldC;
    StateEffect: typeof StateEffectC;
    ViewPlugin: typeof ViewPluginC;
    ViewUpdate: typeof ViewUpdateC;
    WidgetType: typeof WidgetTypeC;
    hoverTooltip: typeof hoverTooltipC;
    keymap: FacetC<readonly KeyBindingC[]>;
    syntaxTree: typeof syntaxTreeC;
    invertedEffects: typeof invertedEffectsC;
    ChangeSet: typeof ChangeSetC;
    undo: typeof undoC;
    redo: typeof redoC;
    isolateHistory: typeof isolateHistoryC;
};

type CodeMirrorVimExt = {
    Vim: typeof VimC;
    getCM: typeof getCMC;
    CodeMirror: typeof CodeMirrorVimC;
};
type extraExtensions = {
    RangeSet: typeof RangeSetC;
    RangeValue: typeof RangeValueC;
    RangeSetBuilder: typeof RangeSetBuilderC;
};

type OverleafEventDetail = {
    CodeMirror: CodeMirrorExt;
    extensions: ExtensionC[];
    CodeMirrorVim: CodeMirrorVimExt;
    extraExtensions?: extraExtensions;
};

type Overleaf_event = CustomEvent<OverleafEventDetail>;

async function browser_main() {
    const settingsCallback = loadSettings();
    window.addEventListener("UNSTABLE_editor:extensions", async (e) => {
        const evt = e as unknown as Overleaf_event;
        const { CodeMirror, extensions } = evt.detail;
        const { keymap } = CodeMirror;
        const Facet = Object.getPrototypeOf(keymap)
            .constructor as typeof FacetC;
        const main_extension = (settings: LatexSuitePluginSettings) =>
            main(
                {
                    ...CodeMirror,
                    Facet,
                    //@ts-ignore
                    RangeSet,
                    //@ts-ignore
                    RangeSetBuilder,
                    RangeValue,
                },
                settings,
            );
        const plugin = main_extension(EMPTY_SETTINGS);
        const latex_suite_extensions = plugin.extension;
        extensions.push(latex_suite_extensions);
        const view = await new Promise(
            (resolve: (view: EditorViewC) => void, reject) => {
                const view = CodeMirror.EditorView.findFromDOM(
                    document.documentElement,
                );
                if (!view) reject("No view found");
                const conf_interval = setInterval(() => {
                    //@ts-expect-error - internal type.
                    if (view.state?.config.base.length > 0) resolve(view);
                    clearInterval(conf_interval);
                }, 100);
            },
        );
        //@ts-expect-error - internal type.
        const Compartment: typeof CompartmentC = view.state.config.compartments
            .keys()
            .next().value.constructor;
        const latexSuiteConfigCompartment = new Compartment();
        extensions.push(latexSuiteConfigCompartment.of(extensions));
        settingsCallback(view, latexSuiteConfigCompartment, main_extension);
    });
}

const loadSettings = () => {
    let view: EditorViewC | null = null;
    let latexSuiteConfigCompartment: CompartmentC | null = null;
    let cachedSettings: LatexSuiteCMSettings | null = null;
    let main_extension_ref:
        | ((settings: LatexSuitePluginSettings) => ExtensionC)
        | null = null;
    const settingsCallback = (
        viewTemp: EditorViewC,
        latexSuiteConfigCompartmentTemp: CompartmentC,
        main_extension: (settings: LatexSuitePluginSettings) => ExtensionC,
    ) => {
        view = viewTemp;
        latexSuiteConfigCompartment = latexSuiteConfigCompartmentTemp;
        main_extension_ref = main_extension;
        if (!cachedSettings) {
            window.dispatchEvent(new CustomEvent("snippet_leaf_config_listen"));
        } else {
            view.dispatch({
                effects: latexSuiteConfigCompartment.reconfigure(
                    main_extension(cachedSettings),
                ),
            });
        }
    };
    settingsCallback.view = null as null | EditorViewC;
    settingsCallback.latexSuiteConfigCompartment = null as null | CompartmentC;
    settingsCallback.latexSuiteConfig = null as null | LatexSuiteFacet;
    window.addEventListener("snippet_leaf_config_send", (e) => {
        if (!view || !latexSuiteConfigCompartment || !main_extension_ref)
            return;
        const main_extension = main_extension_ref;
        const viewTemp = view;
        const latexSuiteConfigCompartmentTemp = latexSuiteConfigCompartment;
        const evt = e as CustomEvent<string>;
        const config: unknown =
            typeof evt.detail === "string"
                ? JSON.parse(evt.detail)
                : evt.detail;
        v.safeParseAsync(SettingsSchema, config).then((parsed_settings) => {
            if (!parsed_settings.success) {
                return;
            }
            cachedSettings = parsed_settings.output;
            viewTemp.dispatch({
                effects: latexSuiteConfigCompartmentTemp.reconfigure(
                    main_extension(parsed_settings.output),
                ),
            });
            const messageBox = document.createElement("div");
            messageBox.style.position = "fixed";
            messageBox.style.top = "2rem";
            messageBox.style.right = "1rem";
            messageBox.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            messageBox.style.color = "white";
            messageBox.style.padding = "10px";
            messageBox.style.borderRadius = "5px";
            messageBox.style.zIndex = "1000";
            messageBox.textContent = "Snippetleaf settings updated!";
            window.document.body.appendChild(messageBox);

            setTimeout(() => {
                document.body.removeChild(messageBox);
            }, 3000);
        });
    });
    return settingsCallback;
};

browser_main();
