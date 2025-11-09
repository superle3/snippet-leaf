## 0.0.3 (2025-09-11)

### Bug fixes

- Fix OOM bug. The extension kept trying to get the settings and with that causing an update which made it ask settings again.

### New features

- Show small message that settings are loaded.
- Debounce the settings listener, such that the storage qoute doesn't get used up.

## 0.0.2 (2025-09-10)

### Bug fixes

- Export the objects needed to run this as an codemirror extension

### New features

- Delay the error message given when editing snippets.

## 0.0.1 (2025-08-26)

Initial Release

A self-signed extension file will be provided. The extension
will (hopefully) be uploaded later on AMO and the chrome extension store.

### New features

- Snippet engine
    - snippet config in typescript
    - Auto-fraction
    - Math context adjusted for latex
    - Snippet variables in json5
- Keymaps:
    - Matrix shortcuts
    - Tabout
- Highlighting and colorizing brackets
- Concealment of math equations with possible delayed reveal
- Settings
    - TypeScript (es2015) instead of javascript and custom hovertooltip for
      jsdoc documentation.

### Breaking changes

- Snippet syntax changed from `$X`, `${X:placeholder}`, `[[X]]`, to `@X`, `@{X}`, `@{X:placeholder}` and `@[X]`. Where you can now escape `@` with `@@`, so you can still use all characters.

### Removed

- Math preview (not currently possible for Overleaf, therefor omitted)

## 0.0.4 (2025-11-09)

### New features

- Optimized snippet detection and expansion
- Optimized concealment

### Bug fixes

- Bounds are detected correctly for `$$` and `\begin{...} \end{...}` such that you can still type `\begin{array}[]{cc}... \end{array}`
