export class Options {
    mode: Mode;
    automatic: boolean;
    regex: boolean;
    onWordBoundary: boolean;
    visual: boolean;
    undoKey: boolean;

    constructor({
        mode,
        automatic,
        regex,
        onWordBoundary,
        visual,
        undoKey,
    }: {
        mode: Mode;
        automatic: boolean;
        regex: boolean;
        onWordBoundary: boolean;
        visual: boolean;
        undoKey: boolean;
    }) {
        this.mode = mode;
        this.automatic = automatic;
        this.regex = regex;
        this.onWordBoundary = onWordBoundary;
        this.visual = visual;
        this.undoKey = undoKey;
    }

    static fromSource(source: string): Options {
        const mode = Mode.fromSource(source);

        let automatic = false;
        let regex = false;
        let onWordBoundary = false;
        let visual = false;
        let undoKey = true;

        for (const flag_char of source) {
            switch (flag_char) {
                case "A":
                    automatic = true;
                    break;
                case "r":
                    regex = true;
                    break;
                case "w":
                    onWordBoundary = true;
                    break;
                case "v":
                    visual = true;
                    break;
                case "U":
                    undoKey = false;
                    break;
            }
        }

        return new Options({
            mode,
            automatic,
            regex,
            onWordBoundary,
            visual,
            undoKey,
        });
    }

    snippetShouldRunInMode(
        mode: Mode,
        ignoreSnippetLessEnv: boolean = false,
    ): boolean {
        if (mode.snippetlessEnv && !ignoreSnippetLessEnv) {
            return false;
        }
        return (
            (this.mode.inlineMath && mode.inlineMath) ||
            (this.mode.blockMath && mode.blockMath) ||
            (this.mode.inText() && mode.inText())
        );
    }

    copy() {
        return new Options({
            ...this,
            mode: this.mode.copy(),
        });
    }
}

export class Mode {
    text: boolean = false;
    dollarInlineMath: boolean = false;
    dollarBlockMath: boolean = false;
    parenInlineMath: boolean = false;
    bracketBlockMath: boolean = false;
    textEnv: boolean = false;
    equation: boolean = false;
    array: boolean = false;
    snippetlessEnv: boolean = false;

    /** Whether the state is inside an inline math environment. */
    get inlineMath(): boolean {
        return this.dollarInlineMath || this.parenInlineMath;
    }

    /** Whether the state is inside a block math environment. */
    get blockMath(): boolean {
        return (
            this.dollarBlockMath ||
            this.bracketBlockMath ||
            this.equation ||
            this.array
        );
    }

    /**
     * Whether the state is inside an equation bounded by $ or $$ delimeters.
     */
    inEquation(): boolean {
        return this.inlineMath || this.blockMath;
    }

    /**
     * Whether the state is in any math mode.
     *
     * The equation may be bounded by $ or $$ delimeters, or it may be an equation inside a `math` codeblock.
     */
    inMath(): boolean {
        return this.inlineMath || this.blockMath;
    }

    /**
     * Whether the state is strictly in math mode.
     *
     * Returns false when the state is within math, but inside a text environment, such as \text{}.
     */
    strictlyInMath(): boolean {
        return this.inMath() && !this.textEnv;
    }

    inText(): boolean {
        return this.text || this.textEnv;
    }

    invert() {
        this.text = !this.text;
        this.textEnv = !this.textEnv;
        this.bracketBlockMath = !this.bracketBlockMath;
        this.dollarInlineMath = !this.dollarInlineMath;
        this.dollarBlockMath = !this.dollarBlockMath;
        this.parenInlineMath = !this.parenInlineMath;
    }

    static fromSource(source: string): Mode {
        const mode = new Mode();

        for (const flag_char of source) {
            switch (flag_char) {
                case "m":
                    mode.bracketBlockMath = true;
                    mode.dollarBlockMath = true;
                    mode.parenInlineMath = true;
                    mode.dollarInlineMath = true;
                    mode.equation = true;
                    mode.array = true;
                    break;
                case "n":
                    mode.dollarInlineMath = true;
                    mode.parenInlineMath = true;
                    break;
                case "M":
                    mode.bracketBlockMath = true;
                    mode.dollarBlockMath = true;
                    mode.equation = true;
                    mode.array = true;
                    break;
                case "t":
                    mode.text = true;
                    break;
            }
        }

        if (!(mode.text || mode.inlineMath || mode.blockMath || mode.textEnv)) {
            // for backwards compat we need to assume that this is a catchall mode then
            mode.invert();
            return mode;
        }

        return mode;
    }

    copy(): Mode {
        const newMode = new Mode();
        newMode.text = this.text;
        newMode.dollarInlineMath = this.dollarInlineMath;
        newMode.dollarBlockMath = this.dollarBlockMath;
        newMode.parenInlineMath = this.parenInlineMath;
        newMode.bracketBlockMath = this.bracketBlockMath;
        newMode.textEnv = this.textEnv;
        newMode.equation = this.equation;
        newMode.array = this.array;
        newMode.snippetlessEnv = this.snippetlessEnv;
        return newMode;
    }
}
