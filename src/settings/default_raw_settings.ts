import {
    DEFAULT_SNIPPETS_str,
    DEFAULT_SNIPPET_VARIABLES_str,
} from "codemirror_extension/codemirror_extensions";
import { DEFAULT_SETTINGS } from "./default_settings";

export const DEFAULT_SETTINGS_RAW = {
    ...DEFAULT_SETTINGS,
    snippets: DEFAULT_SNIPPETS_str,
    snippetVariables: DEFAULT_SNIPPET_VARIABLES_str,
};
