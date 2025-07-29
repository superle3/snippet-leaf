import type { EditorView } from "@codemirror/view";
import type {
    StateEffect as StateEffectC,
    StateField as StateFieldC,
} from "@codemirror/state";
import { SnippetChangeSpec } from "./snippet_change_spec";

export function snippetQueues(
    StateEffect: typeof StateEffectC,
    StateField: typeof StateFieldC
) {
    const queueSnippetEffect = StateEffect.define<SnippetChangeSpec>();
    const clearSnippetQueueEffect = StateEffect.define();

    const snippetQueueStateField = StateField.define<SnippetChangeSpec[]>({
        create() {
            return [];
        },

        update(oldState, transaction) {
            let snippetQueue = oldState;

            for (const effect of transaction.effects) {
                if (effect.is(queueSnippetEffect)) {
                    snippetQueue.push(effect.value);
                } else if (effect.is(clearSnippetQueueEffect)) {
                    snippetQueue = [];
                }
            }

            return snippetQueue;
        },
    });

    function queueSnippet(
        view: EditorView,
        from: number,
        to: number,
        insert: string,
        keyPressed?: string
    ) {
        const snippet = new SnippetChangeSpec(from, to, insert, keyPressed);

        view.dispatch({
            effects: [queueSnippetEffect.of(snippet)],
        });
    }

    function clearSnippetQueue(view: EditorView) {
        view.dispatch({
            effects: [clearSnippetQueueEffect.of(null)],
        });
    }
    return {
        queueSnippet,
        clearSnippetQueue,
        snippetQueueStateField,
    };
}
