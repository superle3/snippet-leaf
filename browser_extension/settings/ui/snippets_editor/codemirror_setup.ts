import { basicSetup as basicSetupC } from "codemirror";
import {
    keymap,
    highlightSpecialChars,
    drawSelection,
    dropCursor,
    EditorView,
    lineNumbers,
    rectangularSelection,
    hoverTooltip,
} from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { EditorState, Prec } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import {
    indentOnInput,
    indentUnit,
    bracketMatching,
    syntaxHighlighting,
    defaultHighlightStyle,
} from "@codemirror/language";
import {
    defaultKeymap,
    indentWithTab,
    history,
    historyKeymap,
} from "@codemirror/commands";
import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
} from "@codemirror/autocomplete";

import {
    createSystem,
    createVirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import * as ts from "typescript";
import {
    tsLinter,
    tsAutocomplete,
    tsSync,
    tsFacet,
} from "@valtown/codemirror-ts";
import { libFiles } from "browser_extension/settings/typescript";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";
import snippet_leaf from "inline:../../snippet_leaf.ts";

export const basicSetup = (snippets: string): Extension[] => {
    const fsMap = new Map();
    for (const file of libFiles.keys()) {
        fsMap.set("/" + file, libFiles.get(file));
    }
    fsMap.set("/user_snippets.ts", snippets);
    const typeDef = snippet_leaf;
    fsMap.set("/snippet_leaf.ts", typeDef);
    const system = createSystem(fsMap);

    const compilerOpts: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.ES2015,
        strict: false,
    };

    const env = createVirtualTypeScriptEnvironment(
        system,
        ["/user_snippets.ts", "/snippet_leaf.ts"],
        ts,
        compilerOpts,
    );

    const path = "user_snippets.ts";

    // Sadly there is no ready-made typescript+jsdoc hover
    // So we create our own where typescript gets highlighted and the jsdoc doesn't
    const tsJSDocHover = hoverTooltip((view, pos) => {
        try {
            const quickInfo = env.languageService.getQuickInfoAtPosition(
                path,
                pos,
            );
            if (!quickInfo) return null;
            const start = quickInfo.textSpan.start;
            const end = start + quickInfo.textSpan.length;
            const signature = ts.displayPartsToString(
                quickInfo.displayParts || [],
            );
            const docs = ts.displayPartsToString(quickInfo.documentation || []);
            const tags = (quickInfo.tags || [])
                .map(
                    (t) =>
                        `@${t.name} ${ts.displayPartsToString(t.text || [])}`,
                )
                .join("\n");

            return {
                pos: start,
                end,
                create: () => {
                    // Render the quickInfo inside a read-only mini CodeMirror view so
                    // syntax highlighting and nicer formatting (colors) are applied.
                    const dom = document.createElement("div");
                    dom.style.maxWidth = "40em";
                    dom.style.maxHeight = "20em";
                    dom.style.overflow = "auto";
                    dom.style.padding = "6px";

                    const docLines: string[] = [];
                    if (docs) docLines.push(docs);
                    if (tags) docLines.push(tags);
                    const docText = docLines.join("\n");

                    const sigState = EditorState.create({
                        doc: signature,
                        extensions: [
                            javascript({ typescript: true, jsx: false }),
                            syntaxHighlighting(defaultHighlightStyle, {
                                fallback: false,
                            }),
                            EditorView.lineWrapping,
                            EditorView.editable.of(false),
                            EditorView.theme({
                                "&": {
                                    fontSize: "12px",
                                    backgroundColor: "transparent",
                                },
                                ".cm-content": { padding: "0" },
                            }),
                        ],
                    });
                    const sigView = new EditorView({
                        state: sigState,
                        parent: dom,
                    });

                    let docEl: HTMLElement | null = null;
                    if (docText) {
                        docEl = document.createElement("pre");
                        docEl.className = "cm-docblock";
                        docEl.textContent = docText;
                        docEl.style.margin = "4px 0 0 0";
                        docEl.style.whiteSpace = "pre-wrap";
                        docEl.style.fontFamily =
                            "var(--cm-font-family, monospace)";
                        docEl.style.fontSize = "12px";
                        docEl.style.color = "var(--cm-foreground, inherit)";
                        dom.appendChild(docEl);
                    }

                    return {
                        dom,
                        destroy: () => {
                            sigView.destroy();
                        },
                    };
                },
            };
        } catch {
            return null;
        }
    });

    const ts_extensions = [
        javascript({
            typescript: true,
            jsx: false,
        }),
        tsFacet.of({
            path,
            env,
        }),
        tsSync(),
        tsLinter(),
        autocompletion({
            override: [tsAutocomplete()],
        }),
        tsJSDocHover,
    ];
    return [
        basicSetupC,
        lineNumbers(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        indentUnit.of("    "),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        highlightSelectionMatches(),
        Prec.highest(
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...searchKeymap,
                ...historyKeymap,
                indentWithTab,
                ...lintKeymap,
            ]),
        ),
        ts_extensions,
    ];
};
