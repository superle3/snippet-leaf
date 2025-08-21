export type SnippetSignature = {
    trigger: string | RegExp;
    replacement: string | ((match: unknown) => unknown);
    options: string;
    flags?: string;
    priority?: number;
    description?: string;
    version?: number;
};
