import type { EditorView } from "@codemirror/view";
import { ViewPlugin } from "@codemirror/view";
import { SnippetChangeSpec } from "./snippet_change_spec";
import {
    applyReplacements,
    type Replacement,
    type ResultInsert,
} from "../luasnip_api/node";
import type { EditorState } from "@codemirror/state";
export const snippetQueuePlugin = ViewPlugin.fromClass(
    class {
        snippetQueue: SnippetChangeSpec[] = [];

        clearSnippetQueue() {
            this.snippetQueue = [];
        }

        QueueSnippets(values: SnippetChangeSpec[]) {
            this.snippetQueue = this.snippetQueue.concat(values);
        }

        get snippetQueueValue(): SnippetChangeSpec[] {
            return this.snippetQueue.map(
                (s) =>
                    new SnippetChangeSpec(
                        s.from,
                        s.to,
                        s.insert,
                        s.keyPressed,
                        s.after,
                    ),
            );
        }
    },
);

export function getSnippetQueue(view: EditorView) {
    const plugin = view.plugin(snippetQueuePlugin);
    if (!plugin) {
        throw new Error(
            "SnippetQueue plugin not found, something went wrong with the plugin initialization",
        );
    }
    return plugin;
}

export function queueSnippet(
    view: EditorView,
    from: number,
    to: number,
    insert: ResultInsert,
    keyPressed?: string,
    after?: number,
) {
    insert = keepIndentAndCallout(view.state, from, to, insert);
    const snippet = new SnippetChangeSpec(from, to, insert, keyPressed, after);
    getSnippetQueue(view).QueueSnippets([snippet]);
}

const keepIndentAndCallout = (
    state: EditorState,
    _from: number,
    to: number,
    replacement: ResultInsert,
): ResultInsert => {
    const d = state.doc;
    const lineText = d.lineAt(to).text;
    const matchIndents = lineText.match(/^\s*/);
    const leadingIndents = matchIndents ? matchIndents[0] : "";
    const matches = replacement.insert.matchAll(/\n(\t*)/g);
    if (!matches) return replacement;

    const tabstops = replacement.tabstops;
    const replacementInsert: Replacement[] = [];
    let offset = 0;
    for (const match of matches) {
        const p1 = match[1];
        // not preserving misalignment when indent level is increased
        const newIndent =
            "\n" + leadingIndents + " ".repeat(4).repeat(p1.length);
        const addedLength = newIndent.length - match[0].length;
        for (const ts of tabstops) {
            if (ts.from - offset > match.index) {
                ts.from += addedLength;
            }
            if (ts.to - offset > match.index) {
                ts.to += addedLength;
            }
        }
        offset += addedLength;
        replacementInsert.push({
            start: match.index,
            end: match.index + match[0].length,
            replacement: newIndent,
        });
    }
    return {
        insert: applyReplacements(replacement.insert, replacementInsert),
        tabstops: tabstops,
    };
};

export function clearSnippetQueue(view: EditorView) {
    getSnippetQueue(view).clearSnippetQueue();
}
