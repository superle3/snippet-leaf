import type { EditorState } from "@codemirror/state";
import { SnippetChangeSpec } from "./snippet_change_spec";
import type { EditorView } from "@codemirror/view";
class SnippetQueue {
    private snippetQueue: SnippetChangeSpec[] = [];

    clearSnippetQueue() {
        this.snippetQueue = [];
    }

    QueueSnippets(values: SnippetChangeSpec[]) {
        this.snippetQueue = this.snippetQueue.concat(values);
    }

    get snippetQueueValue(): SnippetChangeSpec[] {
        return this.snippetQueue.map(
            (s) => new SnippetChangeSpec(s.from, s.to, s.insert, s.keyPressed),
        );
    }
}
export const snippetQueueStateField = new SnippetQueue();

export function queueSnippet(
    view: EditorView,
    from: number,
    to: number,
    insert: string,
    keyPressed?: string,
) {
    const snippet = new SnippetChangeSpec(
        from,
        to,
        keepIndentAndCallout(view.state, from, to, insert),
        keyPressed,
    );
    snippetQueueStateField.QueueSnippets([snippet]);
}

export const CALLOUTREGEX = /^\s*/;
const keepIndentAndCallout = (
    state: EditorState,
    from: number,
    to: number,
    replacement: string,
): string => {
    const d = state.doc;
    const lineText = d.lineAt(to).text;
    const matchIndents = lineText.match(/^\s*/);
    const leadingIndents = matchIndents ? matchIndents[0] : "";
    return replacement.replace(/\n(\t*)/g, (_, p1) => {
        return "\n" + leadingIndents + " ".repeat(4).repeat(p1.length);
    });
};

export function clearSnippetQueue() {
    snippetQueueStateField.clearSnippetQueue();
}
