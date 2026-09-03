import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { latex } from "codemirror-lang-latex";
import { basicSetup } from "codemirror";
import {
    latex_suite,
    type LatexSuitePluginSettings,
} from "codemirror_extension/codemirror_extensions";
import { conceal } from "src/editor_extensions/conceal_fns";
import { reloadLatexSuiteFacetCompartment } from "src/settings/raw_settings";
import { contextPlugin } from "src/latex_context/context";

declare global {
    interface Window {
        view: EditorView;
        conceal: typeof conceal;
        setSettings: (settings: Partial<LatexSuitePluginSettings>) => void;
        contextPlugin: typeof contextPlugin;
    }
}
const extensions: Extension[] = [latex(), basicSetup, latex_suite()];
const doc = `
$$
E=mc^2
$$
`;

const parent = document.getElementById("editor")!;
const view = new EditorView({
    parent,
    extensions,
    doc,
});

function setSettings(settings: Partial<LatexSuitePluginSettings>) {
    reloadLatexSuiteFacetCompartment(settings);
}

declare module "@codemirror/view" {
    interface EditorView {
        setDoc(doc: string, pos?: number): void;
    }
}
view.setDoc = function (doc: string, pos?: number) {
    this.dispatch({
        changes: { from: 0, to: this.state.doc.length, insert: doc },
        selection: pos !== undefined ? { anchor: pos } : undefined,
    });
};

window.view = view;
window.conceal = conceal;
window.setSettings = setSettings;
window.contextPlugin = contextPlugin;

window.dispatchEvent(
    new CustomEvent("latex-suite-ready", { detail: { view } }),
);
