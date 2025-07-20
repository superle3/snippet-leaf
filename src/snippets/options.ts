export class Options {
    mode!: Mode;
    automatic: boolean;
    regex: boolean;
    onWordBoundary: boolean;
    visual: boolean;

    constructor() {
        this.mode = new Mode();
        this.automatic = false;
        this.regex = false;
        this.onWordBoundary = false;
        this.visual = false;
    }

    static fromSource(source: string): Options {
        const options = new Options();
        options.mode = Mode.fromSource(source);

        for (const flag_char of source) {
            switch (flag_char) {
                case "A":
                    options.automatic = true;
                    break;
                case "r":
                    options.regex = true;
                    break;
                case "w":
                    options.onWordBoundary = true;
                    break;
                case "v":
                    options.visual = true;
                    break;
            }
        }

        return options;
    }
}

export class Mode {
    text: boolean;
    dollarInlineMath: boolean;
    dollarBlockMath: boolean;
    parenInlineMath: boolean;
    bracketBlockMath: boolean;
    textEnv: boolean;

    /** Whether the state is inside an inline math environment. */
    get inlineMath(): boolean {
        return this.dollarInlineMath || this.parenInlineMath;
    }

    /** Whether the state is inside a block math environment. */
    get blockMath(): boolean {
        return this.dollarBlockMath || this.bracketBlockMath;
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

    constructor() {
        this.text = false;
        this.textEnv = false;
        this.bracketBlockMath = false;
        this.dollarInlineMath = false;
        this.dollarBlockMath = false;
        this.parenInlineMath = false;
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
                    break;
                case "n":
                    mode.dollarInlineMath = true;
                    mode.parenInlineMath = true;
                    break;
                case "M":
                    mode.bracketBlockMath = true;
                    mode.dollarBlockMath = true;
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
}
