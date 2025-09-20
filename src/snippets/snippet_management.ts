import type { Decoration as DecorationC, EditorView } from "@codemirror/view";
import type {
    EditorSelection as EditorSelectionC,
    ChangeSet as ChangeSetC,
    StateEffect,
    Text,
} from "@codemirror/state";
// import { startSnippet } from "./codemirror/history";
import type { stateEffect_variables } from "./codemirror/history";
import type { isolateHistory as isolateHistoryC } from "@codemirror/commands";
import type { TabstopSpec } from "./tabstop";
import { tabstopSpecsToTabstopGroups } from "./tabstop";
import type { create_tabstopsStateField } from "./codemirror/tabstops_state_field";
import type { SnippetChangeSpec } from "./codemirror/snippet_change_spec";
import { resetCursorBlink } from "../utils/editor_utils";
import {
    clearSnippetQueue,
    snippetQueueStateField,
} from "./codemirror/snippet_queue_state_field";

export type expandSnippetsC = (view: EditorView) => boolean;
export function expandSnippets(
    view: EditorView,
    ChangeSet: typeof ChangeSetC,
    isolateHistory: typeof isolateHistoryC,
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
    Decoration: typeof DecorationC,
): boolean {
    const snippetsToExpand = snippetQueueStateField.snippetQueueValue;
    if (snippetsToExpand.length === 0) return false;

    const originalDocLength = view.state.doc.length;

    // Try to apply changes all at once, because `view.dispatch` gets expensive for large documents
    const undoChanges = handleUndoKeypresses(
        view,
        snippetsToExpand,

        ChangeSet,
        isolateHistory,
        startSnippet,
    );
    const newDoc = undoChanges.changes.apply(view.state.doc);
    const tabstopsToAdd = computeTabstops(
        newDoc,
        snippetsToExpand,
        originalDocLength,
        ChangeSet,
    );

    // Insert any tabstops
    if (tabstopsToAdd.length === 0) {
        view.dispatch(undoChanges);
        clearSnippetQueue();
        return true;
    }

    expandTabstops(
        view,
        tabstopsToAdd,
        undoChanges,
        newDoc.length,
        getTabstopGroupsFromView,
        addTabstops,
        getNextTabstopColor,
        endSnippet,
        EditorSelection,
        Decoration,
        ChangeSet,
    );

    clearSnippetQueue();
    return true;
}

function handleUndoKeypresses(
    view: EditorView,
    snippets: SnippetChangeSpec[],
    ChangeSet: typeof ChangeSetC,
    isolateHistory: typeof isolateHistoryC,
    startSnippet: ReturnType<typeof stateEffect_variables>["startSnippet"],
) {
    const originalDoc = view.state.doc;
    const originalDocLength = originalDoc.length;

    const keyPresses: { from: number; to: number; insert: string }[] = [];
    for (const snippet of snippets) {
        if (snippet.keyPressed && snippet.keyPressed.length === 1) {
            // Use prevChar so that cursors are placed at the end of the added text
            const prevChar = view.state.doc.sliceString(
                snippet.to - 1,
                snippet.to,
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
    if (keyPresses.length > 0) {
        view.dispatch({
            changes: keyPresses,
            annotations: isolateHistory.of("full"),
        });
    }

    // Undo the keypresses, and insert the replacements
    const undoKeyPresses = ChangeSet.of(keyPresses, originalDocLength).invert(
        originalDoc,
    );
    const changesAsChangeSet = ChangeSet.of(snippets, originalDocLength);
    const combinedChanges = undoKeyPresses.compose(changesAsChangeSet);

    // Mark the transaction as the beginning of a snippet (for undo/history purposes)
    return {
        changes: combinedChanges,
        effects: startSnippet.of(null),
    };
}

function computeTabstops(
    doc: Text,
    snippets: SnippetChangeSpec[],
    originalDocLength: number,
    ChangeSet: typeof ChangeSetC,
) {
    // Find the positions of the cursors in the new document
    const changeSet = ChangeSet.of(snippets, originalDocLength);
    const oldPositions = snippets.map((change) => change.from);
    const newPositions = oldPositions.map((pos) => changeSet.mapPos(pos));

    const tabstopsToAdd: TabstopSpec[] = [];
    for (let i = 0; i < snippets.length; i++) {
        tabstopsToAdd.push(...snippets[i].getTabstops(doc, newPositions[i]));
    }

    return tabstopsToAdd;
}

function expandTabstops(
    view: EditorView,
    tabstops: TabstopSpec[],
    undoChanges: { changes: ChangeSetC; effects: StateEffect<null> },
    newLength: number,
    getTabstopGroupsFromView: ReturnType<
        typeof create_tabstopsStateField
    >["getTabstopGroupsFromView"],
    addTabstops: ReturnType<typeof create_tabstopsStateField>["addTabstops"],
    getNextTabstopColor: ReturnType<
        typeof create_tabstopsStateField
    >["getNextTabstopColor"],
    endSnippet: ReturnType<typeof stateEffect_variables>["endSnippet"],
    EditorSelection: typeof EditorSelectionC,
    Decoration: typeof DecorationC,
    ChangeSet: typeof ChangeSetC,
) {
    const color = getNextTabstopColor(view);
    const tabstopGroups = tabstopSpecsToTabstopGroups(
        tabstops,
        color,
        endSnippet,
        EditorSelection,
        Decoration,
    );
    const changes = ChangeSet.of(
        tabstops.map((tabstop: TabstopSpec) => {
            return {
                from: tabstop.from,
                to: tabstop.to,
                insert: tabstop.replacement,
            };
        }),
        newLength,
    );
    tabstopGroups.forEach((grp) => grp.map(changes));
    // Insert the replacements
    const effects = addTabstops(tabstopGroups).effects;
    view.dispatch({
        effects: [undoChanges.effects, ...effects],
        changes: undoChanges.changes.compose(changes),
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
    >["tabstopsStateField"],
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
