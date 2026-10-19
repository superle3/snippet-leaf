import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";

async function waitForLatexSuiteReady() {
    return new Promise<void>((resolve) => {
        const listener = () => resolve();
        window.addEventListener("latex-suite-ready", listener);
        if (window.view) {
            resolve();
            window.removeEventListener("latex-suite-ready", listener);
        }
    });
}

async function waitTasks() {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

await waitForLatexSuiteReady();
describe("snippet syntax", () => {
    test.for(
        ["abc $0 ${1:abc}", "abc @0 @{1:abc}"]
            .map((replacement, i) => ({
                replacement,
                trigger: (i + 1).toString(),
                options: "tA",
                version: (i + 1) as 1 | 2,
            }))
            .map((snippets, i) => [i + 1, snippets] as const),
    )("v%i snippet tabstops + placeholders", async ([_i, snippets]) => {
        const { view, setSettings } = window;
        setSettings({ snippets: [snippets] });
        const settings = window.getLatexSuiteSettings(view.state);
        expect(settings.snippets.automatic.length).toBe(1);
        view.setDoc("", 0);
        await userEvent.keyboard(snippets.trigger);
        const state = view.state;
        const sel = state.selection;
        expect(state.doc.toString()).toBe("abc  abc");
        expect(sel.main.from).toBe("abc ".length);
        expect(sel.main.empty).toBe(true);
        expect(sel.ranges.length).toBe(1);
        await userEvent.keyboard("{Tab}");
        expect(view.state.doc.toString()).toBe("abc  abc");
        const sel2 = view.state.selection;
        expect(sel2.main.from).toBe("abc  ".length);
        expect(sel2.main.to).toBe("abc  abc".length);
        expect(sel2.main.empty).toBe(false);
        expect(sel2.ranges.length).toBe(1);
    });

    test.for(
        ["abc ${VISUAL} abc", "abc @{VISUAL} abc"]
            .map((replacement, i) => ({
                replacement,
                trigger: (i + 1).toString(),
                options: "",
                version: (i + 1) as 1 | 2,
            }))
            .map((snippets, i) => [i + 1, snippets] as const),
    )("v%i snippet with visual magic string", async ([_i, snippets]) => {
        const { view, setSettings } = window;
        setSettings({ snippets: [snippets] });
        await waitTasks();
        const settings = window.getLatexSuiteSettings(view.state);
        expect(settings.snippets.automatic.length).toBe(0);
        expect(settings.snippets.all.length).toBe(1);
        expect(settings.snippets.all[0]!.triggerKey).toBe(snippets.trigger);
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: "test string",
            },
            selection: { anchor: 0, head: "test string".length },
        });
        expect(view.state.doc.toString()).toBe("test string");
        await userEvent.keyboard(snippets.trigger);
        const state = view.state;
        const selection = state.selection;
        expect(state.doc.toString()).toBe("abc test string abc");
        expect(selection.main.from).toBe("".length);
        expect(selection.main.to).toBe("abc test string abc".length);
        expect(selection.main.empty).toBe(false);
        expect(selection.ranges.length).toBe(1);
    });
});
