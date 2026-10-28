import default_snippets_str from "src/default_snippets.js?raw";
import default_snippets from "../default_snippets";
import type { InputRawSnippet } from "src/snippets/parse";

export const DEFAULT_SNIPPETS_str: string = default_snippets_str;

export const DEFAULT_SNIPPETS: InputRawSnippet[] =
    default_snippets as InputRawSnippet[];
