/**
 * Represents how an snippet object should look like, defining the trigger, replacement, options, and other metadata for a code snippet.
 */
export type SnippetSignature = {
    /** The text that triggers this snippet */
    trigger: string | RegExp;
    /** The text or function that replaces the trigger. @X,@{X},@{X:placeholder} represent tabstops and in string replacements `@[X]` represent the matched text for version 2
     * function may only return false if its a visual snippet.
     */
    replacement: string | ((match: string | RegExpExecArray) => string | false);
    /** Defines in which context the snippet can expand,
     * options are: t(ext), A(utomatic), w(ord-boundary), m(ath), M(display math), n(inline math)
     * No m,M,n,t means all contexts */
    options: string;
    /** Allowed flags: i (case insensitive), m(ultiline), s (dot matches newlines), u (unicode), v (verbose)*/
    flags?: string;
    /** If two or more snippets get triggered at the same time, this defines their priority. If priority is equal, the snippet that was defined first will be used. */
    priority?: number;
    /** A description of what the snippet does */
    description?: string;
    /** The version of the snippet syntax, if not defined will default to the version defined in the settings. */
    version?: 1 | 2;
};

/**
 * Currently does nothing but give IntelliSense for snippet definitions. May be used in later versions.
 * @param snippets The snippets to define.
 * @returns The defined snippets.
 */
export function defineSnippets(
    snippets: SnippetSignature[],
): SnippetSignature[] {
    return snippets;
}
