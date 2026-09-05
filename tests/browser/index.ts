import { StateField, Text, type Extension } from "@codemirror/state";
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
import { debounce } from "src/editor_extensions/obsidian_utils";

declare global {
    interface Uint8Array {
        toBase64(options: { alphabet: "base64" | "base64url" }): string;
    }
    interface Uint8ArrayConstructor {
        fromBase64: (
            source: string,
            options: {
                alphabet: "base64" | "base64url";
            },
        ) => Uint8Array;
    }
}

const setUrl = debounce(
    (text: Text) => {
        const compression = new CompressionStream("gzip");
        const doc = text.toString();
        new Response(new Blob([doc]).stream().pipeThrough(compression))
            .bytes()
            .then((blob) => {
                const hash = blob.toBase64({ alphabet: "base64url" });
                history.replaceState(null, "", `#${hash}`);
            });
    },
    500,
    true,
);
const extensions: Extension[] = [
    latex(),
    basicSetup,
    latex_suite(),
    StateField.define({
        create(state) {
            setUrl(state.doc);
        },
        update(_, tr) {
            setUrl(tr.state.doc);
        },
    }),
];
let doc = `
\\begin{align}

\\end{align}
`;

if (window.location.hash.length > 1) {
    try {
        const rawHash = window.location.hash.slice(1);

        // Convert base64url string back to Uint8Array
        const compressedBytes = Uint8Array.fromBase64(rawHash, {
            alphabet: "base64url",
        }) as unknown as number[];

        // Decompress the stream directly into text
        doc = await new Response(
            // @ts-ignore
            new Blob([compressedBytes])
                .stream()
                .pipeThrough(new DecompressionStream("gzip")),
        ).text();
    } catch (err) {
        console.error("Failed to decode document from URL hash:", err);
    }
}

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
const ctx = view.plugin(contextPlugin)!;
window.ctx = ctx;

window.dispatchEvent(
    new CustomEvent("latex-suite-ready", { detail: { view } }),
);

declare global {
    interface Window {
        view: EditorView;
        conceal: typeof conceal;
        setSettings: (settings: Partial<LatexSuitePluginSettings>) => void;
        contextPlugin: typeof contextPlugin;
        ctx: typeof ctx;
    }
}
