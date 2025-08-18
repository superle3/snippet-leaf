import { basicSetup as basicSetupC } from "codemirror";
import {
    keymap,
    highlightSpecialChars,
    drawSelection,
    dropCursor,
    EditorView,
    lineNumbers,
    rectangularSelection,
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
    tsHover,
    tsAutocomplete,
    tsSync,
    tsFacet,
} from "@valtown/codemirror-ts";
import { libFiles } from "browser_extension/settings/typescript";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";
import snippet_signature from "inline:../../snippet_signature.d.ts";
// const libFiles = new Map();

export const basicSetup = (snippets: string): Extension[] => {
    const fsMap = new Map();
    for (const file of libFiles.keys()) {
        fsMap.set("/" + file, libFiles.get(file));
    }
    fsMap.set("/user_snippets.ts", snippets);
    const typeDef = `
        ${snippet_signature}
        export function defineSnippets(snippets: SnippetSignature[]): SnippetSignature[] {
            return snippets;
        }
    `;
    fsMap.set("/snippet_leaf.ts", typeDef);
    const system = createSystem(fsMap);

    const compilerOpts: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.ES2015,
        // strict: true,
        // noLib: true, // Keep this to prevent automatic lib inclusion
        // skipLibCheck: true,
    };

    // Get the lib files that are actually available and include them as root files

    const env = createVirtualTypeScriptEnvironment(
        system,
        ["/user_snippets.ts", "/snippet_leaf.ts"],
        ts,
        compilerOpts,
    );
    console.log(env.getSourceFile("user_snippets.ts"));

    const path = "user_snippets.ts";
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
        tsHover(),
    ];
    return [
        basicSetupC,
        lineNumbers(),
        highlightSpecialChars(),
        history(),
        javascript(),
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
