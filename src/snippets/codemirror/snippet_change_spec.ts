import type { EditorView } from "@codemirror/view";
import type { ChangeSpec } from "@codemirror/state";
import type { TabstopSpec } from "../tabstop";

/**
 * Represents how a tabstop can look like in a snippet.
 * Examples:
 * - `@1` - a numbered tabstop with no replacement text
 * - `@{2}` - a numbered tabstop with no replacement text, bounded such that `@{2}2` is not tabstop number 22
 * - `@{3:example}` - a named tabstop with replacement text "example"
 *
 * **Note:** For original string `@@1`, the `@` is escaped and treated as a literal `@`, so it does not count as a tabstop.
 * In the actual snippet, we only see `@1` but know from the original string that it was `@@1` and thus it is treated as a literal `@`.
 */
const tabstop_regex = /@(?:(\d+)|\{(\d+)\}|\{(\d+):([^}]+)\})/g;
/**
 * Matches all tabstop-like patterns and escaped `@` in a snippet.
 * Represents how an escaped @ looks like in a snippet.
 * Examples:
 * - `@@` - an escaped `@` that should be treated as a literal `@`
 * - `@{2:example@@}` - a named tabstop with replacement text "example@@", here the `@@` is not escaped and is treated as a literal `@@`
 *
 * tabstop-like pattern is needed on top of escaped `@` to ensure we don't replace the `@@` inside a tabstop like in the string `@{2:example@@}`.
 * (regex is not powerful enough to make a pattern that matches only escaped `@` and not tabstop-like patterns)
 */
const escape_tabstop_regex = /@(?:(@)|\d+|\{\d+\}|\{\d+:([^}]+)\})/g;
export class SnippetChangeSpec {
    from: number;
    to: number;
    insert: string;
    keyPressed?: string;
    /**indexes to **ignore** when placing tabstops, these correspond to literal `@` characters and can't be seen as tabstops */
    escaped_inserts: number[];

    constructor(from: number, to: number, insert: string, keyPressed?: string) {
        this.from = from;
        this.to = to;
        this.insert = insert.replace(escape_tabstop_regex, (match, p1) => {
            if (p1) {
                return "@";
            }
            return match;
        });
        this.keyPressed = keyPressed;
        // offset to account for each `@@` that has been replaced
        let offset = 0;
        this.escaped_inserts =
            Array.from(insert.matchAll(escape_tabstop_regex), (match) => {
                if (match[0] !== "@@") return;
                const result = match.index - offset;
                offset++;
                return result;
            }).filter((val) => val !== undefined) || [];
    }

    getTabstops(view: EditorView, start: number): TabstopSpec[] {
        const text = view.state.doc.sliceString(
            start,
            start + this.insert.length,
        );

        const matches = text.matchAll(tabstop_regex);
        const tabstops: TabstopSpec[] = Array.from(
            matches,
            (match): TabstopSpec | undefined => {
                if (!match || this.escaped_inserts.includes(match.index))
                    return;
                if (match[1]) {
                    const number = parseInt(match[1], 10);
                    return {
                        number: number,
                        from: start + match.index,
                        to: start + match.index + match[0].length,
                        replacement: "",
                    };
                } else if (match[2]) {
                    const number = parseInt(match[2], 10);
                    return {
                        number: number,
                        from: start + match.index,
                        to: start + match.index + match[0].length,
                        replacement: "",
                    };
                } else if (match[3] && match[4]) {
                    const number = parseInt(match[3], 10);
                    return {
                        number: number,
                        from: start + match.index,
                        to: start + match.index + match[0].length,
                        replacement: match[4],
                    };
                }
            },
        ).filter((val) => val);
        return tabstops;
    }

    toChangeSpec(): ChangeSpec {
        return this;
    }
}
