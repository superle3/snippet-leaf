# Documentation

## Snippets

_Snippets_ are shortcuts that allow you to insert certain text based on certain triggers. The structure of a snippet is as follows:

```typescript
{
  trigger: string | RegExp,
  replacement: string | (arg) => string | false,
  options: string,
  priority?: number,
  description?: string,
  flags?: string,
  version?: 1 | 2,
}
```

- `trigger` : The text that triggers this snippet.
    - Triggers can also be regular expressions. See [regex snippets](#regex-snippets).
- `replacement` : The text to replace the `trigger` with.
    - Replacements can also be JavaScript functions. See [function snippets](#function-snippets).
- `options` : See below.
- `priority` (optional): This snippet's priority. Snippets with higher priority are run first. Can be negative. Defaults to 0.
- `description` (optional): A description for this snippet.
- `flags` (optional): Flags for [regex snippets](#regex).
    - Not applicable to non-regex snippets.
    - The following flags are permitted: `i`, `m`, `s`, `u`, `v`.
- `version` (optional): version number for snippet syntax. [See here for more info](#versions)

### Options

- `t` : Text mode. Only run this snippet outside math
- `m` : Math mode. Only run this snippet inside math. Shorthand for both `M` and `n`
- `M` : Block math mode. Only run this snippet inside a `$$ ... $$` or `\[ ... \]` block
- `n` : Inline math mode. Only run this snippet inside a `$ ... $` or `\( ... \)` block
- `A` : Auto. Expand this snippet as soon as the trigger is typed. If omitted, the <kbd>Tab</kbd> key must be pressed to expand the snippet
- `r` : [Regex](#regex-snippets). The `trigger` will be treated as a regular expression
- `v` : [Visual](#visual-snippets). Only run this snippet on a selection. The trigger should be a single character
- `w` : Word boundary. Only run this snippet when the trigger is preceded (and followed by) a word delimiter, such as `.`, `,`, or `-`.

Multiple options can be used at once. As an exception, regex and visual are mutually exclusive.

No mode specified means that this snippet can be triggered _at all times_. Multiple modes specified mean that a snippet can be triggered in the given modes, independent of each other.

### Tabstops

- Insert tabstops for the cursor to jump to using `@X` or `@{X}`, where X is a number starting from 0.
- Pressing <kbd>Tab</kbd> will move the cursor to the next tabstop.
- Tabstops can have placeholders. Use the format `@{X:text}`, where `text` is the text that will be selected by the cursor on moving to this tabstop.
- Tabstops with the same number, X, will all be selected at the same time.

#### Examples

```typescript
{trigger: "//", replacement: "\\frac{@0}{@1}@2", options: "mA"}

{trigger: "dint", replacement: "\\int_{@{0:0}}^{@{1:\\infty}} @2 d@{3:x}", options: "mA"}

{trigger: "outp", replacement: "\\ket{@{0:\\psi}} \\bra{@{0:\\psi}} @1", options: "mA"}
```

### Regex snippets

[Regular expressions](https://en.wikipedia.org/wiki/Regular_expression) are sequences of characters that specify a match pattern. (If you're unfamiliar with regex, [here's a tutorial you might like to check out](https://regexone.com).)

In Latex Suite, you can use regular expressions to write more general snippets that expand according to some match pattern that you specify.

To create a regex snippet, you can

- use the `r` option, or
- make the `trigger` a RegExp literal (such as `/regex-goes-here/`).

When creating a regex snippet,

- In the `trigger`, surround an expression with brackets `()` to create a capturing group or `(?<name>)` to create a named capturing group.
- Inside a `replacement` string
    - strings of the form `@[X]` will be replaced by matches in increasing order of X, starting from 0.
    - strings of the form `@[name]` will be replaced if `name` is a group in the `trigger`.
- You can also make the `replacement` a JavaScript function. See [function snippets](#function-snippets) for more details.

#### Example

The snippet

```typescript
{trigger: "([A-Za-z])(\\d)", replacement: "@[0]]_{@[1]}", options: "rA"}
```

will expand `x2` to `x_{2}`, `a1` to `a_{1}` and so on.

Using a RegExp literal and named groups, the same snippet can be written as

```typescript
{trigger: /(?<letter>[A-Za-z])(?<number>\d)/, replacement: "@[letter]_{@[number]}", options: "A"}
```

> [!IMPORTANT]
>
> - Some characters, such as `\`, `+`, and `.`, are special characters in regex. If you want to use these literally, remember to escape them by inserting two backslashes (`\\`) before them!
>     - (One backslash to escape the special character, and another to escape that backslash)
> - `@` is a special syntax of this extension alone. If you don't want `@1` or `@[1]` to be tabstop or captured group, be sure to escape them by another `@` before them like `@@1` or `@@[1]`.
> - [Lookbehind regex is not supported on iOS.](https://github.com/bicarlsen/obsidian_image_caption/issues/4#issuecomment-982982629) Using lookbehind regex will cause snippets to break on iOS.

### Snippet variables

Snippet variables are used as shortcuts when writing snippets. In the `trigger` of a snippet, strings with the format `"${VARIABLE}"` will be replaced with the contents of the matching variable if it's defined, and left unchanged otherwise.

By default, the following variables are available for use in a `trigger`:

- `${GREEK}` : Shorthand for the following by default:

    ```
    alpha|beta|gamma|Gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|vartheta|Theta|iota|kappa|lambda|Lambda|mu|nu|xi|omicron|pi|rho|varrho|sigma|Sigma|tau|upsilon|Upsilon|phi|varphi|Phi|chi|psi|omega|Omega
    ```

    Recommended for use with the regex option "r".

- `${SYMBOL}` : Shorthand for the following by default:

    ```
    parallel|perp|partial|nabla|hbar|ell|infty|oplus|ominus|otimes|oslash|square|star|dagger|vee|wedge|subseteq|subset|supseteq|supset|emptyset|exists|nexists|forall|implies|impliedby|iff|setminus|neg|lor|land|bigcup|bigcap|cdot|times|simeq|approx
    ```

    Recommended for use with the regex option "r".

- `${MORE_SYMBOLS}` : Shorthand for the following by default:

    ```
    leq|geq|neq|gg|ll|equiv|sim|propto|rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|to|mapsto|cap|cup|in|sum|prod|exp|ln|log|det|dots|vdots|ddots|pm|mp|int|iint|iiint|oint
    ```

    Recommended for use with the regex option "r".

Snippet variables can be changed in the settings, under **Advanced editor settings > Snippet variables**. You can also choose to [load your snippet variables from files](#snippet-variables-files).

### Visual snippets

Sometimes you want to annotate math, or cancel or cross out terms. **Visual snippets** can be used to surround your current selection with other text.

For example, the snippet

```typescript
{trigger: "U", replacement: "\\underbrace{ @{VISUAL} }_{ @0 }", options: "mA"},
```

will surround your selection with an `\underbrace` when "U" is typed.

![visual snippets](gifs/visual_snippets.gif)

To create a visual snippet, you can

- make the replacement a string containing the special string `@{VISUAL}`, or
- use the `v` option, and make the replacement a function.

When a visual snippet is expanded, the special string `@{VISUAL}` in its replacement is replaced with the current selection.

To create a visual snippet, you can alternatively use the `v` option and make the replacement a [function](#function-snippets) that takes the selection as an argument. For example, the previous snippet can be written as

```typescript
{trigger: "U", replacement: (sel) => ("\\underbrace{" + sel + "}_{ @0 }"), options: "mv"},
```

.

Visual snippets will not expand unless text is selected.

### Function snippets

Replacements can also be functions, written in JavaScript. For example, the snippet

```typescript
{trigger: "date", replacement: () => (new Date().toDateString()), options: "t"},
```

will expand "date<kbd>Tab</kbd>" to the current date, such as "Mon Jan 15 2023".

Function snippets work with regex and visual snippets as well.

#### Regex function snippets

For [**regex** snippets](#regex-snippets), Latex Suite will pass in the `RegExpExecArray` returned by the matching regular expression to your replacement function. This lets you access the value of capture groups inside your function. For example, the regex snippet

```typescript
{trigger: /iden(\d)/, replacement: (match) => {
    const n = match[1];

    let arr = [];
    for (let j = 0; j < n; j++) {
        arr[j] = [];
        for (let i = 0; i < n; i++) {
            arr[j][i] = (i === j) ? 1 : 0;
        }
    }

    let output = arr.map(el => el.join(" & ")).join(" \\\\\n");
    output = `\\begin{pmatrix}\n${output}\n\\end{pmatrix}`;
    return output;
}, options: "mA"},
```

will expand "iden4" to a 4×4 identity matrix:

```latex
\begin{pmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{pmatrix}
```

. More generally, it will expand "idenN" to an N×N identity matrix.

#### Visual function snippets

Function replacements can also be used for [visual snippets](#visual-snippets). To do this, use the `v` option, and make the replacement a function that takes the selection as an argument. Latex Suite will pass in the selection to your replacement function.

For example, the snippet

```typescript
{trigger: "K", replacement: (sel) => ("\\cancelto{ @0 }{" + sel + "}"), options: "mv"},
```

will surround your selection with a `\cancelto` when "K" is typed.

The snippet

```typescript
{trigger: "-", replacement: sel => { if (!sel.includes(" ")) { return false } return sel.replaceAll(/\s+/g, "-")}, options: "vA"},
```

will convert all spaces in your selection to hypens (for example, `hello world` will expand to `hello-world`) when "-" is typed.

---

In general, **function snippets** take the form

```ts
{
  replacement:
    | ((str: string) => string)
    | ((match: RegExpExecArray) => string) // Regex snippets
    | ((selection: string) => (string | false)) // Visual snippets
}
```

based on which type of snippet the replacement applies to.

If a snippet replacement function returns a non-string value, the snippet is ignored and will not expand.

## Sharing snippets

You can [view obsidian-snippets written by others and share your own snippets there](https://github.com/artisticat1/obsidian-latex-suite/discussions/50).
These need version number 1 instead of 2, [see below for more information](#versions).

> [!WARNING]
> Snippet files are interpreted as JavaScript and can execute arbitrary code.
> Always be careful with snippets shared from others to avoid running malicious code.

## Transfering from Obsidian

### Syntax change

[Obsidian Latex Suite](https://github.com/artisticat1/obsidian-latex-suite/) uses snippet syntax of `version 1`. You can either change the syntax of every snippet or add `version: 1` to every snippet with the old syntax.

## Versions

Here are the the specs of different versions defined.
The regexes are there to serve as an spec for maintainers,
please look at the actual examples to see the differences

### `version: 1`

#### Tabstops:

```ts
const replacement_regex = /\$\d|\$\{\d+:[^\}]\}/;
```

It matches the following examples in `replacement`:

- `$0`
- `${0:example}`
- `${10:example}`

Notably it doesn't match `$10` as the 11th tabstop but as the second tabstop and the number `0`.

#### Regex capture groups

```ts
const replacement_regex = /\[\[\d+\]\]/;
```

It only replaces this group if the number inside is not higher than the number of capture groups.

It matches the following examples in `replacement`:

```js
const snippet1 = { trigger: /(hello)/, replacement: "[[0]] world" }; // -> hello world
const snippet2 = { trigger: /(hello) (world)/, replacement: "[[1]]-[[0]]" }; // -> world-hello
```

Notably it matches all `[[X]]` up to the defined capture groups.
So if there are 5 capture groups `[[5]]` doesn't get matched.
Even if nothing gets matched in the capture group, it is still replaced with `undefined`.
The replacement is done on a macro level so tabstops can be created with `$[[X]]` if the captured group is a number between 0-9.
See the following example:

```js
/** Output: `hello` -> `hello [[1]]`*/
const does_not_match_all = { trigger: /(hello)/, replacement: "[[0]][[1]]" };

/**
 * Output:
 * - `hello` -> `hello-undefined`
 * - `world` -> `undefined-world`
 */
const undefined_snippet = {
    trigger: /(hello)|(world)/,
    replacement: "[[0]]-[[1]]",
};
/**
 * Output:
 * `1` -> `[cursors]$`
 * `23` -> `$23$`
 */
const tabstop_snippet = { trigger: /(\d+)/, replacement: "$[[0]]$" };
```

#### Visual capture

```js
const replacement_regex = /\$\{VISUAL\}/;
```

It automatically converts any `${VISUAL}` it sees in the replacement if it can be a visual snippet,
i.e. it is not a regex snippet and the trigger is one character long.

### `version: 2`

`@` was used instead of `$` and `[[X]]`, since this character will rarely be used in latex leading to less conflict.

#### Tabstops:

```ts
const replacement_regex = /(?<!@)\@\d+|\@\{\d+\}|\@\{\d+:[^\}]\}/;
```

It matches the following examples in `replacement`:

- `@0`
- `@{0:example}`
- `@{10:example}`
- `@{10}`
- `@10`

This time it does match `@10` as the 11th tabstop and the number can be encapsulated to avoid conflicts such as `@22` when you want it to expand to `<third-tabstop>2`.

#### Regex capture groups

```ts
const replacement_regex_unnamed = /(?<!@)@\[\d+\]/;
```

It only replaces this group if the number inside is not higher than the number of capture groups.

It matches the following examples in `replacement`:

```js
const snippet1 = { trigger: /(hello)/, replacement: "@[0] world" }; // -> hello world
const snippet2 = { trigger: /(hello) (world)/, replacement: "@[1]-@[0]" }; // -> world-hello
```

Notably it doesn't match the following example because the amount of captured groups is less than the number inside

```js
const snippet = { trigger: /(hello)/, replacement: "@[0] @[1]" }; // -> hello @[1]
```

It can also match a named group. A named group is any javascript identifier. So in ASCII the following: `/[A-Za-z$_][A-Za-z$_0-9]*/` would match all identifiers.
Only names that are in the trigger regex will be replaced. `${CAPTURED_NAMES}` consists of all the possible names in the trigger snippet.

```ts
const replacement_regex_named = /(?<!@)@\[${CAPTURED_NAMES}]/;
```

It matches the following example:

```ts
const snippet = {
    trigger: /(?<letter>[A-Za-z])(?<subscript>[0-9])/,
    replacement: "@[letter]_{@[subscript]}",
};
// `A1` -> A_{1}
```

**Note:** named and unnamed groups that don't capture anything will get replaced with nothing instead of `undefined`.
See the following example:

```ts
const snippet = {
    trigger: /(hello)|(world)/,
    replacement: "[[0]]-[[1]]",
};
// `hello` -> `hello-` `world` -> `-world`
```

#### Visual capture

```js
const replacement_regex = /(?<!@)\@\{VISUAL\}/;
```

It automatically converts any `@{VISUAL}` it sees in the replacement if it can be a visual snippet,
i.e. it is not a regex snippet and the trigger is one character long.

#### Escaping \@

Here only what is inside the captured group is the spec.

```js
const replacement_regex = /(@@)|\@\d+|\@\{\d+\}|\@\{\d+:[^\}]\}/;
```

It only replaces `@@` with literal `@` that are outside tabstop placeholders
so it matches`@@1`, but it doesn't match `@{0:@@}`
