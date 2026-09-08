import { describe, expect, it } from "vitest";

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

await waitForLatexSuiteReady();
describe("context test", () => {
    it("should be in normal display math", () => {
        const { view, ctx } = window;
        view.setDoc(
            `$$
E=mc^2
$$
`,
            "$$\nE=mc^2".length,
        );
        expect(ctx.mode.blockMath).toBe(true);
    });

    it("should be in inline math", () => {
        const { view, ctx } = window;
        view.setDoc("$E=mc^2$", "$E=mc^2".length);
        expect(ctx.mode.inlineMath).toBe(true);
    });

    it("should be in equation environment", () => {
        const { view, ctx } = window;
        view.setDoc(
            "\\begin{equation}E=mc^2\\end{equation}",
            "\\begin{equation}E=mc^2".length,
        );
        expect(ctx.mode.blockMath).toBe(true);
        expect(ctx.mode.equation).toBe(true);
    });
    it("should be in align environment at the end", () => {
        const { view, ctx } = window;
        view.setDoc(
            "\\begin{align}\nE&=mc^2\\\n\\end{align}",
            "\\begin{align}\nE&=mc^2\n".length,
        );
        expect(ctx.mode.blockMath).toBe(true);
        expect(ctx.mode.array).toBe(true);
    });
    it("should not be in align environment at the beginning", () => {
        const { view, ctx } = window;
        view.setDoc(
            "\\begin{align}\nE&=mc^2\\\n\\end{align}",
            "\\begin{align}".length,
        );
        expect(ctx.mode.array).toBe(false);
    });
    it("should be in align environment at the beginning", () => {
        const { view, ctx } = window;
        view.setDoc(
            "\\begin{align}\nE&=mc^2\\\n\\end{align}",
            "\\begin{align}\nE&=mc^2".length,
        );
        expect(ctx.mode.array).toBe(true);
    });

    it("should be in align environment when empty", () => {
        const { view, ctx } = window;
        view.setDoc(
            "\\begin{align}\n\n\\end{align}",
            "\\begin{align}\n".length,
        );
        expect(ctx.mode.array).toBe(true);
    });

    it("should be in text environment when nothing but newlines", () => {
        const { view, ctx } = window;
        view.setDoc("\n\n\n", "\n".length);
        expect(ctx.mode.inText()).toBe(true);
    });
});
