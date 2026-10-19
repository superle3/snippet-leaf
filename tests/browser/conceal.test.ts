import { describe, expect, it } from "vitest";

describe("conceal", async () => {
    it("Simple einstein equation", async () => {
        const conceal = window.test.conceal;
        const view = window.view;
        // set content to "Einstein's equation is $E=mc^2$."
        const basic_display = `
$$
E = mc^2
$$
`;
        view.setDoc(basic_display);
        const basic_output = conceal(view);
        expect(basic_output.cached_equations).toStrictEqual({
            "E = mc^2": [
                [
                    {
                        start: 6,
                        end: 8,
                        text: "2",
                        class: "cm-number",
                        elementType: "sup",
                    },
                ],
            ],
        });
    });

    it("multiline equation", async () => {
        const conceal = window.test.conceal;
        const view = window.view;
        const equation = `
$$
X_{1}
X_{2}
$$
`;
        view.setDoc(equation);
        const equation_result = conceal(view).cached_equations;
        const result = [equation_result] as const;
        result.forEach((equation_result) => {
            expect(equation_result).toStrictEqual({
                "X_{1}": [
                    [
                        {
                            start: 1,
                            end: 5,
                            text: "1",
                            class: "cm-number",
                            elementType: "sub",
                        },
                    ],
                ],
                "X_{2}": [
                    [
                        {
                            start: 1,
                            end: 5,
                            text: "2",
                            class: "cm-number",
                            elementType: "sub",
                        },
                    ],
                ],
            });
        });
    });

    it("malformed multiline equation", async () => {
        const view = window.view;
        const conceal = window.test.conceal;
        const start_end_equation = `
$$X_1
X_2
X_3$$
`;
        view.setDoc(start_end_equation);
        const equation_result = conceal(view).cached_equations;
        expect(equation_result).toStrictEqual({
            X_1: [
                [
                    {
                        start: 1,
                        end: 3,
                        text: "1",
                        class: "cm-number",
                        elementType: "sub",
                    },
                ],
            ],
            X_2: [
                [
                    {
                        start: 1,
                        end: 3,
                        text: "2",
                        class: "cm-number",
                        elementType: "sub",
                    },
                ],
            ],
            X_3: [
                [
                    {
                        start: 1,
                        end: 3,
                        text: "3",
                        class: "cm-number",
                        elementType: "sub",
                    },
                ],
            ],
        });
    });

    it("should conceal subscript after parenthesis", async () => {
        const conceal = window.test.conceal;
        const view = window.view;
        const equation = `
$$
(x)^{2}
$$
`;
        view.setDoc(equation);
        const equation_result = conceal(view).cached_equations;
        expect(equation_result).toStrictEqual({
            "(x)^{2}": [
                [
                    {
                        class: "cm-number",
                        elementType: "sup",
                        end: 7,
                        start: 3,
                        text: "2",
                    },
                ],
            ],
        });
    });
    it("should only subscript the first character (#666)", async () => {
        const conceal = window.test.conceal;
        const view = window.view;
        const equation = `
$$
A_bCD⊗EFG
$$
`;
        view.setDoc(equation);
        const equation_result = conceal(view).cached_equations;
        expect(equation_result).toStrictEqual({
            "A_bCD⊗EFG": [
                [
                    {
                        class: "cm-number",
                        elementType: "sub",
                        end: 3,
                        start: 1,
                        text: "b",
                    },
                ],
            ],
        });
    });
    it("should only subscript the first number (#666)", async () => {
        const conceal = window.test.conceal;
        const view = window.view;
        const equation = `
$$
A_1234
$$
`;
        view.setDoc(equation);
        const equation_result = conceal(view).cached_equations;
        expect(equation_result).toStrictEqual({
            A_1234: [
                [
                    {
                        class: "cm-number",
                        elementType: "sub",
                        end: 3,
                        start: 1,
                        text: "1",
                    },
                ],
            ],
        });
    });

    it("should subscript \\left and \\right", async () => {
        const conceal = window.test.conceal;
        const view = window.view;
        const equation = `
$$
A_\\left(1\\alpha 234\\right)
$$
`;
        view.setDoc(equation);
        const equation_result = conceal(view).cached_equations;
        expect(equation_result).toStrictEqual({
            "A_\\left(1\\alpha 234\\right)": [
                [
                    {
                        class: "cm-number",
                        elementType: "sub",
                        end: 26,
                        start: 1,
                        text: "\\left(1α 234\\right)",
                    },
                ],
                [],
                [
                    {
                        end: 15,
                        start: 9,
                        text: "α",
                    },
                ],
                [],
            ],
        });
    });

    it("should subscript A_a\u0304 a full grapheme cluster", async () => {
        const conceal = window.test.conceal;
        const view = window.view;
        const equation = `
$$
A_a\u0304
$$
`;
        view.setDoc(equation);
        const equation_result = conceal(view).cached_equations;
        expect(equation_result).toStrictEqual({
            "A_a\u0304": [
                [
                    {
                        class: "cm-number",
                        elementType: "sub",
                        end: 4,
                        start: 1,
                        text: "a\u0304",
                    },
                ],
            ],
        });
    });
    it("should subscript stop in a reasonable time for a long equation when the parser is not done yet.", async () => {
        const conceal = window.test.conceal;
        const inside_equation =
            "a_{\\alpha\\epsilon\\omega\\omega\\omega \\omega }".repeat(100);
        const equation = "${}" + inside_equation + "{}$";
        // explicitly not testing the output as the parser may finish at different points in time due to cpu load, ram load, etc.
        // main point is that it doesn't timeout.
        // have to create it this way, as view.setDoc will make the parser parse the full equation as it parses the whole viewport synchronous.
        const view = window.test.createNormalView(equation);
        return conceal(view).cached_equations;
    });
});
