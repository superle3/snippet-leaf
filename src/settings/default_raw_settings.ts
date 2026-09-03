import { DEFAULT_SNIPPETS_str } from "src/utils/default_snippets";
import {
    DEFAULT_SETTINGS,
    type LatexSuitePluginSettingsRaw,
} from "./default_settings";
import { DEFAULT_SNIPPET_VARIABLES_str } from "src/utils/default_snippet_variables";

export const DEFAULT_SETTINGS_RAW: LatexSuitePluginSettingsRaw = {
    ...DEFAULT_SETTINGS,
    snippets: DEFAULT_SNIPPETS_str,
    snippetVariables: DEFAULT_SNIPPET_VARIABLES_str,
};
