/**
 * Represents a simplified snippet object.
 * If the user doesn't type hint their object and doesn't use as const
 * then version will get inferred as number instead of 1 | 2.
 * Same goes for the function signature.
 */
export type SnippetSignature = {
    trigger: string | RegExp;
    replacement: string | ((match: unknown) => unknown);
    options: string;
    flags?: string;
    priority?: number;
    description?: string;
    version?: number;
};
