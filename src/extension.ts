import {
    EditorSelection as EditorSelectionC,
    Extension as ExtensionC,
    StateEffect as StateEffectC,
    StateField as StateFieldC,
    Prec as PrecC,
    Facet as FacetC,
} from "@codemirror/state";
import {
    Decoration as DecorationC,
    EditorView as EditorViewC,
    KeyBinding as KeyBindingC,
    ViewPlugin as ViewPluginC,
    WidgetType as WidgetTypeC,
    hoverTooltip as hoverTooltipC,
} from "@codemirror/view";
import { syntaxTree as syntaxTreeC } from "@codemirror/language";
import {
    CodeMirror as CodeMirrorVimC,
    Vim as VimC,
    getCM as getCMC,
} from "@replit/codemirror-vim";

type CodeMirrorExt = {
    Decoration: typeof DecorationC;
    EditorSelection: typeof EditorSelectionC;
    EditorView: typeof EditorViewC;
    Prec: typeof PrecC;
    StateField: typeof StateFieldC;
    StateEffect: typeof StateEffectC;
    ViewPlugin: typeof ViewPluginC;
    WidgetType: typeof WidgetTypeC;
    hoverTooltip: typeof hoverTooltipC;
    keymap: FacetC<readonly KeyBindingC[]>;
    syntaxTree: typeof syntaxTreeC;
};

type CodeMirrorVimExt = {
    Vim: typeof VimC;
    getCM: typeof getCMC;
    CodeMirror: typeof CodeMirrorVimC;
};

type OverleafEventDetail = {
    CodeMirror: CodeMirrorExt;
    extensions: ExtensionC[];
    CodeMirrorVim?: CodeMirrorVimExt;
};

type Overleaf_event = CustomEvent<OverleafEventDetail>;

function log_info(...messages: any[]) {
    console.log("extension_info:", ...messages);
    console.log("HEEEEEEER");
}

function getAllPropertyNames(obj: any) {
    const props = new Set<string>();
    while (obj) {
        Object.getOwnPropertyNames(obj).forEach((p) => props.add(p));
        obj = Object.getPrototypeOf(obj);
    }
    return Array.from(props);
}

async function main() {
    await get_codemirror;
    console.log(Object.entries(cm));
    const evt = { detail } as Overleaf_event;
    await new Promise((resolve) => {
        const view = detail.CodeMirror.EditorView.findFromDOM(document);
        let i = 0;
        const conf_interval = setInterval(() => {
            if (view.state.config.base.length > 0) resolve(true);
            clearInterval(conf_interval);
            i++;
            if (i > 20) resolve(true);
        }, 100);
    });
    console.log("view loaded")
    return;
    console.log(evt);
    const { CodeMirrorVim, extensions } = evt.detail;
    const {
        Decoration,
        EditorSelection,
        EditorView,
        Prec,
        StateField,
        StateEffect,
        ViewPlugin,
        WidgetType,
        hoverTooltip,
        syntaxTree,
        keymap,
    } = CodeMirror;
    const { Vim, getCM } = CodeMirrorVim || {};
    const helloWorldKeymap = [
        {
            key: "ArrowRight",
            run: (view: EditorViewC) => {
                console.log("Hello World!");
                view.dispatch({
                    changes: {
                        from: view.state.selection.main.head,
                        insert: "hello world",
                    },
                });
                return true; // Prevent default
            },
        },
    ];

    // Add the custom keymap to the editor
    extensions.push(
        CodeMirror.Prec.highest(CodeMirror.keymap.of(helloWorldKeymap))
    );
    console.log(keymap);
}
let detail, cm;
let get_codemirror = new Promise((resolve) => {
    window.addEventListener("UNSTABLE_editor:extensions", (evt) => {
        cm = evt.detail.CodeMirror;
        // detail = evt.detail;
        resolve();
    }, { once: true });
});
get_codemirror.then(() => {
    console.log("CodeMirror loaded:", Object.entries(cm));
});
// main()
// tampermonkey()
    

// window.addEventListener("UNSTABLE_editor:extensions", (e) => main(e as unknown as Overleaf_event));

function tampermonkey() {
    window.addEventListener("UNSTABLE_editor:extensions", (e) => {
        const evt = e as unknown as Overleaf_event;
        const { CodeMirror, CodeMirrorVim, extensions } = evt.detail;
        const {
            Decoration,
            EditorSelection,
            EditorView,
            Prec,
            StateField,
            StateEffect,
            ViewPlugin,
            WidgetType,
            hoverTooltip,
            syntaxTree,
        } = CodeMirror;
        const { Vim, getCM, CodeMirror: CodeMirrorVimT } = CodeMirrorVim || {};
        console.log("Tampermonkey script loaded");
        console.log("CodeMirror:", CodeMirror);
        console.log("CodeMirrorVim:", CodeMirrorVim);
        console.log("Extensions:", extensions);
        extensions.push(
            CodeMirror.Prec.highest(
                CodeMirror.keymap.of([
                    {
                        key: "ArrowRight",
                        run: (view: EditorViewC) => {
                            console.log("Hello from Tampermonkey!");
                            view.dispatch({
                                changes: {
                                    from: view.state.selection.main.head,
                                    insert: "hello world",
                                },
                            });
                            return true; // Prevent default
                        },
                    },
                ])
            )
        );
        console.log("Keymap added to extensions");
    });
}
