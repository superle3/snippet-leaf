import * as ts from "typescript";
import { get_settings } from "./browser_storage_wrapper";
import browser from "webextension-polyfill";
import { debounce } from "src/utils/debounce";

async function send_config(): Promise<void> {
    const config = await get_transpiled_settings();
    document.dispatchEvent(
        new CustomEvent("snippet_leaf_config_send", {
            detail: JSON.stringify(config),
            bubbles: true,
            cancelable: true,
        }),
    );
}

async function get_transpiled_settings() {
    const settings = await get_settings();
    return {
        ...settings,
        snippets: compiler(settings.snippets),
    };
}

const compiler = (source: string) => {
    // Remove the `import {...} from "snippet_leaf"` statement as it should be its own module.
    // Using the AST from the typescript compiler
    // probably overkill, but safer and more functions can be added later
    const variables: string[] = [];
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        return (sourceFile) => {
            const visitor = (node: ts.Node): ts.Node => {
                if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
                    const moduleSpecifier = node.moduleSpecifier;
                    if (ts.isStringLiteral(moduleSpecifier)) {
                        const moduleName = moduleSpecifier.text;
                        if (
                            moduleName === "snippet_leaf" ||
                            moduleName === "./snippet_leaf" ||
                            moduleName === "/snippet_leaf"
                        ) {
                            const importClause = node.importClause;

                            if (importClause) {
                                const namedBindings =
                                    importClause.namedBindings;

                                if (
                                    namedBindings &&
                                    ts.isNamedImports(namedBindings)
                                ) {
                                    namedBindings.elements.forEach(
                                        (element) => {
                                            if (element.propertyName) {
                                                variables.push(
                                                    element.propertyName.text,
                                                );
                                            } else {
                                                variables.push(
                                                    element.name.text,
                                                );
                                            }
                                        },
                                    );
                                } else if (importClause.name) {
                                    variables.push(importClause.name.text);
                                }
                            }
                            return undefined;
                        }
                    }
                }

                return ts.visitEachChild(node, visitor, context);
            };

            return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
        };
    };

    let outputText = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
            lib: ["ESNext"],
            skipLibCheck: true,
        },
        transformers: {
            after: [transformer],
        },
    }).outputText;

    if (variables.includes("defineSnippets")) {
        // function declarations are hoisted, so we can put it at the end of the file.
        outputText = outputText + "\nfunction defineSnippets(s) {return s}";
    }
    return outputText;
};

const delayed_send_config = debounce(send_config, 3000);
document.addEventListener("snippet_leaf_config_listen", async () => {
    await send_config();
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
        console.debug("Settings changed, sending updated config", changes);
        delayed_send_config();
    }
});
