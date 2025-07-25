import { Decoration as DecorationC, EditorView } from "@codemirror/view";
import {
    EditorSelection as EditorSelectionC,
    ChangeSet as ChangeSetC,
} from "@codemirror/state";
// import { startSnippet } from "./codemirror/history";
import type { stateEffect_variables } from "./codemirror/history";
import type { isolateHistory as isolateHistoryC } from "@codemirror/commands";
import type { TabstopSpec } from "./tabstop";
import { tabstopSpecsToTabstopGroups } from "./tabstop";
import type { create_tabstopsStateField } from "./codemirror/tabstops_state_field";
import type { snippetQueues } from "./codemirror/snippet_queue_state_field";
import type { SnippetChangeSpec } from "./codemirror/snippet_change_spec";
import { resetCursorBlink } from "../utils/editor_utils";

export type expandSnippetsC = (view: EditorView) => boolean;
export function expandSnippets(
    view: EditorView,
    ChangeSet: typeof ChangeSetC,
    isolateHistory: typeof isolateHistoryC,
    snippetQueueStateField: ReturnType<
        typeof snippetQueues
    >["snippetQueueStateField"],
    clearSnippetQueue: ReturnType<typeof snippetQueues>["clearSnippetQueue"],
    addTabstops: ReturnType<typeof create_tabstopsStateField>["addTabstops"],
    getTabstopGroupsFromView: ReturnType<
        typeof create_tabstopsStateField
    >["getTabstopGroupsFromView"],
    getNextTabstopColor: ReturnType<
        typeof create_tabstopsStateField
    >["getNextTabstopColor"],
    startSnippet: ReturnType<typeof stateEffect_variables>["startSnippet"],
    endSnippet: ReturnType<typeof stateEffect_variables>["endSnippet"],
    EditorSelection: typeof EditorSelectionC,
    Decoration: typeof DecorationC
): boolean {
    const snippetsToExpand = view.state.field(snippetQueueStateField);
    if (snippetsToExpand.length === 0) return false;

    const originalDocLength = view.state.doc.length;

    handleUndoKeypresses(
        view,
        snippetsToExpand,
        ChangeSet,
        isolateHistory,
        startSnippet
    );

    const tabstopsToAdd = computeTabstops(
        view,
        snippetsToExpand,
        originalDocLength,
        ChangeSet
    );

    // Insert any tabstops
    if (tabstopsToAdd.length === 0) {
        clearSnippetQueue(view);
        return true;
    }

    markTabstops(
        view,
        tabstopsToAdd,
        addTabstops,
        getNextTabstopColor,
        endSnippet,
        EditorSelection,
        Decoration
    );
    expandTabstops(view, tabstopsToAdd, getTabstopGroupsFromView);

    clearSnippetQueue(view);
    return true;
}

function handleUndoKeypresses(
    view: EditorView,
    snippets: SnippetChangeSpec[],
    ChangeSet: typeof ChangeSetC,
    isolateHistory: typeof isolateHistoryC,
    startSnippet: ReturnType<typeof stateEffect_variables>["startSnippet"]
) {
    const originalDoc = view.state.doc;
    const originalDocLength = originalDoc.length;

    const keyPresses: { from: number; to: number; insert: string }[] = [];
    for (const snippet of snippets) {
        if (snippet.keyPressed && snippet.keyPressed.length === 1) {
            // Use prevChar so that cursors are placed at the end of the added text
            const prevChar = view.state.doc.sliceString(
                snippet.to - 1,
                snippet.to
            );

            const from = snippet.to === 0 ? 0 : snippet.to - 1;
            keyPresses.push({
                from: from,
                to: snippet.to,
                insert: prevChar + snippet.keyPressed,
            });
        }
    }

    // Insert the keypresses
    // Use isolateHistory to allow users to undo the triggering of a snippet,
    // but keep the text inserted by the trigger key
    view.dispatch({
        changes: keyPresses,
        annotations: isolateHistory.of("full"),
    });

    // Undo the keypresses, and insert the replacements
    const undoKeyPresses = ChangeSet.of(keyPresses, originalDocLength).invert(
        originalDoc
    );
    const changesAsChangeSet = ChangeSet.of(snippets, originalDocLength);
    const combinedChanges = undoKeyPresses.compose(changesAsChangeSet);

    // Mark the transaction as the beginning of a snippet (for undo/history purposes)
    view.dispatch({
        changes: combinedChanges,
        effects: startSnippet.of(null),
    });
}

function computeTabstops(
    view: EditorView,
    snippets: SnippetChangeSpec[],
    originalDocLength: number,
    ChangeSet: typeof ChangeSetC
) {
    // Find the positions of the cursors in the new document
    const changeSet = ChangeSet.of(snippets, originalDocLength);
    const oldPositions = snippets.map((change) => change.from);
    const newPositions = oldPositions.map((pos) => changeSet.mapPos(pos));

    const tabstopsToAdd: TabstopSpec[] = [];
    for (let i = 0; i < snippets.length; i++) {
        tabstopsToAdd.push(...snippets[i].getTabstops(view, newPositions[i]));
    }

    return tabstopsToAdd;
}

function markTabstops(
    view: EditorView,
    tabstops: TabstopSpec[],
    addTabstops: ReturnType<typeof create_tabstopsStateField>["addTabstops"],
    getNextTabstopColor: ReturnType<
        typeof create_tabstopsStateField
    >["getNextTabstopColor"],
    endSnippet: ReturnType<typeof stateEffect_variables>["endSnippet"],
    EditorSelection: typeof EditorSelectionC,
    Decoration: typeof DecorationC
) {
    const color = getNextTabstopColor(view);
    const tabstopGroups = tabstopSpecsToTabstopGroups(
        tabstops,
        color,
        endSnippet,
        EditorSelection,
        Decoration
    );

    addTabstops(view, tabstopGroups);
}

function expandTabstops(
    view: EditorView,
    tabstops: TabstopSpec[],
    getTabstopGroupsFromView: ReturnType<
        typeof create_tabstopsStateField
    >["getTabstopGroupsFromView"]
) {
    // Insert the replacements
    const changes = tabstops.map((tabstop: TabstopSpec) => {
        return {
            from: tabstop.from,
            to: tabstop.to,
            insert: tabstop.replacement,
        };
    });

    view.dispatch({
        changes: changes,
    });

    // Select the first tabstop
    const firstGrp = getTabstopGroupsFromView(view)[0];
    firstGrp.select(view, false, true); // "true" here marks the transaction as the end of the snippet (for undo/history purposes)
}

// Returns true if the transaction was dispatched
export function setSelectionToNextTabstop(
    view: EditorView,
    tabstopsStateField: ReturnType<
        typeof create_tabstopsStateField
    >["tabstopsStateField"]
): boolean {
    const tabstopGroups = view.state.field(tabstopsStateField);

    function aux(nextGrpIndex: number) {
        const nextGrp = tabstopGroups[nextGrpIndex];
        if (!nextGrp) return false;

        const currSel = view.state.selection;
        // If the current selection lies within the next tabstop(s), move the cursor
        // to the endpoint(s) of the next tabstop(s)
        let nextGrpSel = nextGrp.toEditorSelection();
        if (nextGrp.containsSelection(currSel)) {
            nextGrpSel = nextGrp.toEditorSelection(true);
        }

        if (currSel.eq(nextGrpSel)) return aux(nextGrpIndex + 1);

        view.dispatch({
            selection: nextGrpSel,
        });
        resetCursorBlink();

        return true;
    }

    return aux(1);
}
