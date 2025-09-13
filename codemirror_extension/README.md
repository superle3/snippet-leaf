# codemirror-latex-suite

A port of [obsidian-latex-suite](https://github.com/artisticat1/obsidian-latex-suite) exposing only the CodeMirror 6 extensions. As of right now, this package only supports LaTeX documents and not markdown documents like the original port.
The following features have been ported over:

- Snippet engine. Automatic text expansion makes writing commands much easier. Instead of having to reach for `\`, you can just type `alpha` or `cup`.
- Autofraction. Just use `/` to create a `\frac{$0}{$1}` instead of writing the whole `\frac` out.
- Matrix shortcuts. In math environments such as `align, gather, matrix, etc`, `Enter` -> `\\ \n` (creating a new row), `Tab` -> `&` (creating a new column) and `Shift-Enter` exits the environment.
- Tabout: Use tab to get out of enclosing `(),{},[],\(\),\[\],$$,$$$$`.
- Concealment, change the appearance of `alpha` to α and more.
- Highlighting and coloring brackets: use different colors to differentiate between brackets easier and highlight the brackets the cursor is currently in.

For more details, you can read the [readme](https://github.com/superle3/snippet-leaf/blob/main/README.md) of snippetleaf, the browser extension for overleaf.

## Install

```bash
npm install codemirror-latex-suite
```

## Peer dependencies

This package declares CodeMirror packages as peer dependencies. Make sure your project provides compatible versions of:

- `@codemirror/view`
- `@codemirror/state`
- `@codemirror/commands`
- `@codemirror/language`
- `codemirror-lang-latex`

## Usage

Example:

```ts
import { EditorView, basicSetup } from "@codemirror/basic-setup";
import { latex_suite } from "codemirror-latex-suite";
import { latex } from "codemirror-lang-latex"; // or your LaTeX language package

const view = new EditorView({
    doc: "",
    extensions: [
        basicSetup,
        latex(),
        latex_suite(), // default settings
    ],
    parent: document.body,
});
```
