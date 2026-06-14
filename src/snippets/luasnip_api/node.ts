import { VISUAL_SNIPPET_MAGIC_SELECTION_PLACEHOLDER } from "../snippets";
import type { TabstopSpec } from "../tabstop";

type Captures = { match: string[]; groups: Record<string, string> };

export type Options = {
    captures: Captures;
};
export const emptyInsertOptions: Options = {
    captures: { match: [], groups: {} },
};

export type ResultInsert = {
    insert: string;
    tabstops: readonly TabstopSpec[];
};

export class BaseNode {
    constructor(
        public insert: string | ((context: Options) => string | BaseNode[]),
        public tabstops: readonly TabstopSpec[] = [],
    ) {}

    applyInsert(options: Options): ResultInsert {
        if (typeof this.insert === "string") {
            return { insert: this.insert, tabstops: this.tabstops };
        }
        const result = this.insert(options);
        if (typeof result === "string") {
            return { insert: result, tabstops: this.tabstops };
        }

        let offset = 0;
        const tabstopResults = result
            .map((node) => node.applyInsert(options))
            .map(({ insert, tabstops }) => {
                const currentOffset = offset;
                offset += insert.length;
                return {
                    insert,
                    tabstops: [
                        ...tabstops.map((ts) => ({
                            ...ts,
                            from: ts.from + currentOffset,
                            to: ts.to + currentOffset,
                        })),
                        ...this.tabstops.map((ts) => ({
                            ...ts,
                            from: ts.from + currentOffset,
                            to: ts.to + currentOffset,
                        })),
                    ],
                };
            });
        const insert = tabstopResults.map((r) => r.insert).join("");
        const tabstops = tabstopResults.flatMap((r) => r.tabstops);
        return { insert, tabstops };
    }
}

export class TextNode extends BaseNode {
    constructor(text: string) {
        super(text);
    }
}

export class TabstopNode extends BaseNode {
    constructor(index: number, insert: string = "") {
        super(insert, [{ index: [index], from: 0, to: insert.length }]);
    }
}

export class CaptureNode extends BaseNode {
    constructor(key: number | string, defaultValue: string = "") {
        if (typeof key === "number") {
            super(({ captures }) => captures.match[key] ?? defaultValue);
        } else if (typeof key === "string") {
            super(({ captures }) => captures.groups[key] ?? defaultValue);
        }
    }
}

type Replacement = {
    start: number;
    end: number;
    replacement: string;
};
function applyReplacements(str: string, replacements: Replacement[]): string {
    replacements.sort((a, b) => a.start - b.start);
    let offset = 0;
    const str_arr: string[] = [];
    for (const { start, end, replacement } of replacements) {
        str_arr.push(str.slice(offset, start), replacement);
        offset = end;
    }
    return str_arr.join("") + str.slice(offset);
}

/**
 * @todo fix nested snippets in tabstop management as its currently broken when reversing.
 */
export class SnippetNode extends BaseNode {
    constructor(
        private index: number,
        private nodes: BaseNode[],
    ) {
        super("", []);
    }

    override applyInsert(options: Options): ResultInsert {
        const result = new ArrayNode(this.nodes).applyInsert(options);
        const super_tabstop = {
            index: [this.index],
            from: 0,
            to: result.insert.length,
        };
        const final_result: ResultInsert = {
            insert: result.insert,
            tabstops: [
                super_tabstop,
                ...result.tabstops.map((ts) => ({
                    ...ts,
                    index: [this.index, ...ts.index],
                })),
            ],
        };
        return final_result;
    }
}

export class SnippetStringNode extends BaseNode {
    constructor(
        private snippet: string,
        private version: 1 | 2 = 2,
    ) {
        super((options) => this.parseSnippet(options.captures));
    }

    parseSnippet(captures: Captures): BaseNode[] {
        if (this.version === 1) {
            const expandedCaptures = this.expandCapturesv1(captures);
            const expandedTabstops = this.expandTabstopsv1(expandedCaptures);
            return expandedTabstops;
        } else if (this.version === 2) {
            console.debug("start", this.snippet);
            const expandedCaptures = this.expandCapturesv2(captures);
            console.debug("mid", expandedCaptures);
            const expandedTabstops = this.expandTabstopsv2(expandedCaptures);
            console.debug("end", expandedTabstops);
            return expandedTabstops;
        }
        return this.version satisfies never;
    }

    expandCapturesv1(captures: Captures): string {
        const pattern = /\[\[(\d+)\]\]/g;
        const matches = this.snippet.matchAll(pattern);
        const replacements = [];
        for (const match of matches) {
            const index = parseInt(match[1]);
            if (captures.match[index] === undefined) {
                continue;
            }
            const start = match.index;
            const end = start + match[0].length;
            const replacement = captures.match[index];
            replacements.push({ start, end, replacement });
        }
        return applyReplacements(this.snippet, replacements);
    }

    expandTabstopsv1(snippet: string): BaseNode[] {
        const pattern = /\$(\d)|\$\{(\d+):([^}]*)\}/g;
        const matches = snippet.matchAll(pattern);
        const replacements = [];
        for (const match of matches) {
            const index = parseInt(match[1] || match[2]);
            const start = match.index;
            const end = start + match[0].length;
            const replacement = match[3] || "";
            replacements.push({ start, end, replacement, index });
        }
        const nodes: BaseNode[] = [];
        let offset = 0;
        for (const { start, end, replacement, index } of replacements) {
            nodes.push(new TextNode(snippet.slice(offset, start)));
            nodes.push(new TabstopNode(index, replacement));
            offset = end;
        }
        nodes.push(new TextNode(snippet.slice(offset)));
        return nodes;
    }

    expandCapturesv2(captures: Captures): string {
        const indexes = Array.from({ length: captures.match.length }).map(
            (_, i, arr) => arr.length - i - 1,
        );
        const indexes_group = `(?<index>${indexes.join("|")})`;
        const group_keys = Object.keys(captures.groups).map((key) =>
            key.replace("$", "\\$"),
        );
        const group_keys_group = `(?<group_key>${group_keys.join("|")})`;
        const raw_pattern = `@@|@\\[(?:${indexes_group}|${group_keys_group})\\]`;
        console.debug("capture pattern", raw_pattern);
        const pattern = new RegExp(raw_pattern, "g");
        const replacements = [];
        const matches = this.snippet.matchAll(pattern);
        for (const match of matches) {
            const start = match.index;
            const end = start + match[0].length;
            let replacement = "";
            if (match[0] === "@@") {
                continue;
            } else if (match.groups?.index) {
                const index = parseInt(match.groups.index);
                replacement = captures.match[index] ?? "";
            } else if (match.groups?.group_key) {
                const key = match.groups.group_key;
                replacement = captures.groups[key] ?? "";
            }
            replacements.push({ start, end, replacement });
        }
        console.debug("captures replacements", replacements);
        return applyReplacements(this.snippet, replacements);
    }

    expandTabstopsv2(snippet: string): BaseNode[] {
        const replacement_regex =
            /(?<escape>@@)|@(?<index>\d+)|@\{(?<index>\d+)\}|@\{(?<index>\d+):(?<placeholder>[^}]+)\}/g;
        const matches = snippet.matchAll(replacement_regex);
        type Replacement = {
            start: number;
            end: number;
        } & (
            | { kind: "escape" }
            | { kind: "tabstop"; index: number; replacement: string }
        );
        const replacements: Replacement[] = [];
        for (const match of matches) {
            const start = match.index;
            const end = start + match[0].length;
            if (match.groups?.escape) {
                const kind = "escape";
                replacements.push({ start, end, kind });
            }
            const replacement = match.groups?.placeholder || "";
            const index = parseInt(match.groups.index!);
            const kind = "tabstop";
            replacements.push({ start, end, replacement, index, kind });
        }
        const nodes: BaseNode[] = [];
        let offset = 0;
        for (const replacement of replacements) {
            const { start, end } = replacement;
            nodes.push(new TextNode(snippet.slice(offset, start)));
            offset = end;
            if (replacement.kind === "escape") {
                nodes.push(new TextNode("@"));
                offset = replacement.end;
            } else if (replacement.kind === "tabstop") {
                const { replacement: placeholder, index } = replacement;
                nodes.push(new TabstopNode(index, placeholder));
            } else {
                replacement satisfies never;
            }
        }
        nodes.push(new TextNode(snippet.slice(offset)));
        return nodes;
    }
}

export class VisualSnippetNode extends BaseNode {
    constructor(public snippet: string) {
        super((options) =>
            new SnippetStringNode(
                this.expandVisual(options.captures),
            ).parseSnippet({ match: [], groups: {} }),
        );
    }

    expandVisual(captures: Captures): string {
        const pattern = VISUAL_SNIPPET_MAGIC_SELECTION_PLACEHOLDER;
        if (!captures.groups[pattern]) {
            throw new Error(
                `VisualSnippetNode requires the presence of a capture group named ${pattern} to indicate the position of the visual selection`,
            );
        }
        return this.snippet.replaceAll(pattern, captures.groups[pattern]);
    }
}
export class SnippetTabstopOnlyNode extends BaseNode {
    constructor(snippet: string) {
        super(() =>
            new SnippetStringNode(snippet).parseSnippet({
                match: [],
                groups: {},
            }),
        );
    }
}

// Discourage to nest array nodes this way and a way to normalize tabstops indexes at the end.
export class ArrayNode extends BaseNode {
    constructor(private children: BaseNode[]) {
        super("", []);
    }

    applyInsert(options: Options): ResultInsert {
        return new BaseNode(() => this.children).applyInsert(options);
    }
}
