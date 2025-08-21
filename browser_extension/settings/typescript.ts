import * as ts from "typescript";
import default_lib from "inline:node_modules/typescript/lib/lib.d.ts";
// import lib_decorators from "inline:node_modules/typescript/lib/lib.decorators.d.ts";
// import lib_decorators_legacy from "inline:node_modules/typescript/lib/lib.decorators.legacy.d.ts";
// import lib_dom_asynciterable from "inline:node_modules/typescript/lib/lib.dom.asynciterable.d.ts";
// import lib_dom from "inline:node_modules/typescript/lib/lib.dom.d.ts";
// import lib_dom_iterable from "inline:node_modules/typescript/lib/lib.dom.iterable.d.ts";
import lib_es2015_collection from "inline:node_modules/typescript/lib/lib.es2015.collection.d.ts";
import lib_es2015_core from "inline:node_modules/typescript/lib/lib.es2015.core.d.ts";
import lib_es2015 from "inline:node_modules/typescript/lib/lib.es2015.d.ts";
import lib_es2015_generator from "inline:node_modules/typescript/lib/lib.es2015.generator.d.ts";
import lib_es2015_iterable from "inline:node_modules/typescript/lib/lib.es2015.iterable.d.ts";
import lib_es2015_promise from "inline:node_modules/typescript/lib/lib.es2015.promise.d.ts";
import lib_es2015_proxy from "inline:node_modules/typescript/lib/lib.es2015.proxy.d.ts";
import lib_es2015_reflect from "inline:node_modules/typescript/lib/lib.es2015.reflect.d.ts";
import lib_es2015_symbol from "inline:node_modules/typescript/lib/lib.es2015.symbol.d.ts";
import lib_es2015_symbol_wellknown from "inline:node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts";
// import lib_es2016_array_include from "inline:node_modules/typescript/lib/lib.es2016.array.include.d.ts";
// import lib_es2016 from "inline:node_modules/typescript/lib/lib.es2016.d.ts";
// import lib_es2016_full from "inline:node_modules/typescript/lib/lib.es2016.full.d.ts";
// import lib_es2016_intl from "inline:node_modules/typescript/lib/lib.es2016.intl.d.ts";
// import lib_es2017_arraybuffer from "inline:node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts";
// import lib_es2017_date from "inline:node_modules/typescript/lib/lib.es2017.date.d.ts";
// import lib_es2017 from "inline:node_modules/typescript/lib/lib.es2017.d.ts";
// import lib_es2017_full from "inline:node_modules/typescript/lib/lib.es2017.full.d.ts";
// import lib_es2017_intl from "inline:node_modules/typescript/lib/lib.es2017.intl.d.ts";
// import lib_es2017_object from "inline:node_modules/typescript/lib/lib.es2017.object.d.ts";
// import lib_es2017_sharedmemory from "inline:node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts";
// import lib_es2017_string from "inline:node_modules/typescript/lib/lib.es2017.string.d.ts";
// import lib_es2017_typedarrays from "inline:node_modules/typescript/lib/lib.es2017.typedarrays.d.ts";
// import lib_es2018_asyncgenerator from "inline:node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts";
// import lib_es2018_asynciterable from "inline:node_modules/typescript/lib/lib.es2018.asynciterable.d.ts";
// import lib_es2018 from "inline:node_modules/typescript/lib/lib.es2018.d.ts";
// import lib_es2018_full from "inline:node_modules/typescript/lib/lib.es2018.full.d.ts";
// import lib_es2018_intl from "inline:node_modules/typescript/lib/lib.es2018.intl.d.ts";
// import lib_es2018_promise from "inline:node_modules/typescript/lib/lib.es2018.promise.d.ts";
// import lib_es2018_regexp from "inline:node_modules/typescript/lib/lib.es2018.regexp.d.ts";
// import lib_es2019_array from "inline:node_modules/typescript/lib/lib.es2019.array.d.ts";
// import lib_es2019 from "inline:node_modules/typescript/lib/lib.es2019.d.ts";
// import lib_es2019_full from "inline:node_modules/typescript/lib/lib.es2019.full.d.ts";
// import lib_es2019_intl from "inline:node_modules/typescript/lib/lib.es2019.intl.d.ts";
// import lib_es2019_object from "inline:node_modules/typescript/lib/lib.es2019.object.d.ts";
// import lib_es2019_string from "inline:node_modules/typescript/lib/lib.es2019.string.d.ts";
// import lib_es2019_symbol from "inline:node_modules/typescript/lib/lib.es2019.symbol.d.ts";
// import lib_es2020_bigint from "inline:node_modules/typescript/lib/lib.es2020.bigint.d.ts";
// import lib_es2020_date from "inline:node_modules/typescript/lib/lib.es2020.date.d.ts";
// import lib_es2020 from "inline:node_modules/typescript/lib/lib.es2020.d.ts";
// import lib_es2020_full from "inline:node_modules/typescript/lib/lib.es2020.full.d.ts";
// import lib_es2020_intl from "inline:node_modules/typescript/lib/lib.es2020.intl.d.ts";
// import lib_es2020_number from "inline:node_modules/typescript/lib/lib.es2020.number.d.ts";
// import lib_es2020_promise from "inline:node_modules/typescript/lib/lib.es2020.promise.d.ts";
// import lib_es2020_sharedmemory from "inline:node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts";
// import lib_es2020_string from "inline:node_modules/typescript/lib/lib.es2020.string.d.ts";
// import lib_es2020_symbol_wellknown from "inline:node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts";
// import lib_es2021 from "inline:node_modules/typescript/lib/lib.es2021.d.ts";
// import lib_es2021_full from "inline:node_modules/typescript/lib/lib.es2021.full.d.ts";
// import lib_es2021_intl from "inline:node_modules/typescript/lib/lib.es2021.intl.d.ts";
// import lib_es2021_promise from "inline:node_modules/typescript/lib/lib.es2021.promise.d.ts";
// import lib_es2021_string from "inline:node_modules/typescript/lib/lib.es2021.string.d.ts";
// import lib_es2021_weakref from "inline:node_modules/typescript/lib/lib.es2021.weakref.d.ts";
// import lib_es2022_array from "inline:node_modules/typescript/lib/lib.es2022.array.d.ts";
// import lib_es2022 from "inline:node_modules/typescript/lib/lib.es2022.d.ts";
// import lib_es2022_error from "inline:node_modules/typescript/lib/lib.es2022.error.d.ts";
// import lib_es2022_full from "inline:node_modules/typescript/lib/lib.es2022.full.d.ts";
// import lib_es2022_intl from "inline:node_modules/typescript/lib/lib.es2022.intl.d.ts";
// import lib_es2022_object from "inline:node_modules/typescript/lib/lib.es2022.object.d.ts";
// import lib_es2022_regexp from "inline:node_modules/typescript/lib/lib.es2022.regexp.d.ts";
// import lib_es2022_string from "inline:node_modules/typescript/lib/lib.es2022.string.d.ts";
// import lib_es2023_array from "inline:node_modules/typescript/lib/lib.es2023.array.d.ts";
// import lib_es2023_collection from "inline:node_modules/typescript/lib/lib.es2023.collection.d.ts";
// import lib_es2023 from "inline:node_modules/typescript/lib/lib.es2023.d.ts";
// import lib_es2023_full from "inline:node_modules/typescript/lib/lib.es2023.full.d.ts";
// import lib_es2023_intl from "inline:node_modules/typescript/lib/lib.es2023.intl.d.ts";
// import lib_es2024_arraybuffer from "inline:node_modules/typescript/lib/lib.es2024.arraybuffer.d.ts";
// import lib_es2024_collection from "inline:node_modules/typescript/lib/lib.es2024.collection.d.ts";
// import lib_es2024 from "inline:node_modules/typescript/lib/lib.es2024.d.ts";
// import lib_es2024_full from "inline:node_modules/typescript/lib/lib.es2024.full.d.ts";
// import lib_es2024_object from "inline:node_modules/typescript/lib/lib.es2024.object.d.ts";
// import lib_es2024_promise from "inline:node_modules/typescript/lib/lib.es2024.promise.d.ts";
// import lib_es2024_regexp from "inline:node_modules/typescript/lib/lib.es2024.regexp.d.ts";
// import lib_es2024_sharedmemory from "inline:node_modules/typescript/lib/lib.es2024.sharedmemory.d.ts";
// import lib_es2024_string from "inline:node_modules/typescript/lib/lib.es2024.string.d.ts";
import lib_es5 from "inline:node_modules/typescript/lib/lib.es5.d.ts";
import lib_es6 from "inline:node_modules/typescript/lib/lib.es6.d.ts";
// import lib_esnext_array from "inline:node_modules/typescript/lib/lib.esnext.array.d.ts";
// import lib_esnext_collection from "inline:node_modules/typescript/lib/lib.esnext.collection.d.ts";
// import lib_esnext_decorators from "inline:node_modules/typescript/lib/lib.esnext.decorators.d.ts";
// import lib_esnext_disposable from "inline:node_modules/typescript/lib/lib.esnext.disposable.d.ts";
// import lib_esnext from "inline:node_modules/typescript/lib/lib.esnext.d.ts";
// import lib_esnext_error from "inline:node_modules/typescript/lib/lib.esnext.error.d.ts";
// import lib_esnext_float16 from "inline:node_modules/typescript/lib/lib.esnext.float16.d.ts";
// import lib_esnext_full from "inline:node_modules/typescript/lib/lib.esnext.full.d.ts";
// import lib_esnext_intl from "inline:node_modules/typescript/lib/lib.esnext.intl.d.ts";
// import lib_esnext_iterator from "inline:node_modules/typescript/lib/lib.esnext.iterator.d.ts";
// import lib_esnext_promise from "inline:node_modules/typescript/lib/lib.esnext.promise.d.ts";
// import lib_esnext_sharedmemory from "inline:node_modules/typescript/lib/lib.esnext.sharedmemory.d.ts";
// import lib_scripthost from "inline:node_modules/typescript/lib/lib.scripthost.d.ts";
// import lib_webworker_asynciterable from "inline:node_modules/typescript/lib/lib.webworker.asynciterable.d.ts";
// import lib_webworker from "inline:node_modules/typescript/lib/lib.webworker.d.ts";
// import lib_webworker_importscripts from "inline:node_modules/typescript/lib/lib.webworker.importscripts.d.ts";
// import lib_webworker_iterable from "inline:node_modules/typescript/lib/lib.webworker.iterable.d.ts";
import snippet_signature from "inline:./snippet_signature.d.ts";
export const libFiles = new Map<string, string>();
libFiles.set("lib.d.ts", default_lib);
// libFiles.set("lib.decorators.d.ts", lib_decorators);
// libFiles.set("lib.decorators.legacy.d.ts", lib_decorators_legacy);
// libFiles.set("lib.dom.asynciterable.d.ts", lib_dom_asynciterable);
// libFiles.set("lib.dom.d.ts", lib_dom);
// libFiles.set("lib.dom.iterable.d.ts", lib_dom_iterable);
libFiles.set("lib.es2015.collection.d.ts", lib_es2015_collection);
libFiles.set("lib.es2015.core.d.ts", lib_es2015_core);
libFiles.set("lib.es2015.d.ts", lib_es2015);
libFiles.set("lib.es2015.generator.d.ts", lib_es2015_generator);
libFiles.set("lib.es2015.iterable.d.ts", lib_es2015_iterable);
libFiles.set("lib.es2015.promise.d.ts", lib_es2015_promise);
libFiles.set("lib.es2015.proxy.d.ts", lib_es2015_proxy);
libFiles.set("lib.es2015.reflect.d.ts", lib_es2015_reflect);
libFiles.set("lib.es2015.symbol.d.ts", lib_es2015_symbol);
libFiles.set("lib.es2015.symbol.wellknown.d.ts", lib_es2015_symbol_wellknown);
// libFiles.set("lib.es2016.array.include.d.ts", lib_es2016_array_include);
// libFiles.set("lib.es2016.d.ts", lib_es2016);
// libFiles.set("lib.es2016.full.d.ts", lib_es2016_full);
// libFiles.set("lib.es2016.intl.d.ts", lib_es2016_intl);
// libFiles.set("lib.es2017.arraybuffer.d.ts", lib_es2017_arraybuffer);
// libFiles.set("lib.es2017.date.d.ts", lib_es2017_date);
// libFiles.set("lib.es2017.d.ts", lib_es2017);
// libFiles.set("lib.es2017.full.d.ts", lib_es2017_full);
// libFiles.set("lib.es2017.intl.d.ts", lib_es2017_intl);
// libFiles.set("lib.es2017.object.d.ts", lib_es2017_object);
// libFiles.set("lib.es2017.sharedmemory.d.ts", lib_es2017_sharedmemory);
// libFiles.set("lib.es2017.string.d.ts", lib_es2017_string);
// libFiles.set("lib.es2017.typedarrays.d.ts", lib_es2017_typedarrays);
// libFiles.set("lib.es2018.asyncgenerator.d.ts", lib_es2018_asyncgenerator);
// libFiles.set("lib.es2018.asynciterable.d.ts", lib_es2018_asynciterable);
// libFiles.set("lib.es2018.d.ts", lib_es2018);
// libFiles.set("lib.es2018.full.d.ts", lib_es2018_full);
// libFiles.set("lib.es2018.intl.d.ts", lib_es2018_intl);
// libFiles.set("lib.es2018.promise.d.ts", lib_es2018_promise);
// libFiles.set("lib.es2018.regexp.d.ts", lib_es2018_regexp);
// libFiles.set("lib.es2019.array.d.ts", lib_es2019_array);
// libFiles.set("lib.es2019.d.ts", lib_es2019);
// libFiles.set("lib.es2019.full.d.ts", lib_es2019_full);
// libFiles.set("lib.es2019.intl.d.ts", lib_es2019_intl);
// libFiles.set("lib.es2019.object.d.ts", lib_es2019_object);
// libFiles.set("lib.es2019.string.d.ts", lib_es2019_string);
// libFiles.set("lib.es2019.symbol.d.ts", lib_es2019_symbol);
// libFiles.set("lib.es2020.bigint.d.ts", lib_es2020_bigint);
// libFiles.set("lib.es2020.date.d.ts", lib_es2020_date);
// libFiles.set("lib.es2020.d.ts", lib_es2020);
// libFiles.set("lib.es2020.full.d.ts", lib_es2020_full);
// libFiles.set("lib.es2020.intl.d.ts", lib_es2020_intl);
// libFiles.set("lib.es2020.number.d.ts", lib_es2020_number);
// libFiles.set("lib.es2020.promise.d.ts", lib_es2020_promise);
// libFiles.set("lib.es2020.sharedmemory.d.ts", lib_es2020_sharedmemory);
// libFiles.set("lib.es2020.string.d.ts", lib_es2020_string);
// libFiles.set("lib.es2020.symbol.wellknown.d.ts", lib_es2020_symbol_wellknown);
// libFiles.set("lib.es2021.d.ts", lib_es2021);
// libFiles.set("lib.es2021.full.d.ts", lib_es2021_full);
// libFiles.set("lib.es2021.intl.d.ts", lib_es2021_intl);
// libFiles.set("lib.es2021.promise.d.ts", lib_es2021_promise);
// libFiles.set("lib.es2021.string.d.ts", lib_es2021_string);
// libFiles.set("lib.es2021.weakref.d.ts", lib_es2021_weakref);
// libFiles.set("lib.es2022.array.d.ts", lib_es2022_array);
// libFiles.set("lib.es2022.d.ts", lib_es2022);
// libFiles.set("lib.es2022.error.d.ts", lib_es2022_error);
// libFiles.set("lib.es2022.full.d.ts", lib_es2022_full);
// libFiles.set("lib.es2022.intl.d.ts", lib_es2022_intl);
// libFiles.set("lib.es2022.object.d.ts", lib_es2022_object);
// libFiles.set("lib.es2022.regexp.d.ts", lib_es2022_regexp);
// libFiles.set("lib.es2022.string.d.ts", lib_es2022_string);
// libFiles.set("lib.es2023.array.d.ts", lib_es2023_array);
// libFiles.set("lib.es2023.collection.d.ts", lib_es2023_collection);
// libFiles.set("lib.es2023.d.ts", lib_es2023);
// libFiles.set("lib.es2023.full.d.ts", lib_es2023_full);
// libFiles.set("lib.es2023.intl.d.ts", lib_es2023_intl);
// libFiles.set("lib.es2024.arraybuffer.d.ts", lib_es2024_arraybuffer);
// libFiles.set("lib.es2024.collection.d.ts", lib_es2024_collection);
// libFiles.set("lib.es2024.d.ts", lib_es2024);
// libFiles.set("lib.es2024.full.d.ts", lib_es2024_full);
// libFiles.set("lib.es2024.object.d.ts", lib_es2024_object);
// libFiles.set("lib.es2024.promise.d.ts", lib_es2024_promise);
// libFiles.set("lib.es2024.regexp.d.ts", lib_es2024_regexp);
// libFiles.set("lib.es2024.sharedmemory.d.ts", lib_es2024_sharedmemory);
// libFiles.set("lib.es2024.string.d.ts", lib_es2024_string);
libFiles.set("lib.es5.d.ts", lib_es5);
libFiles.set("lib.es6.d.ts", lib_es6);
// libFiles.set("lib.esnext.array.d.ts", lib_esnext_array);
// libFiles.set("lib.esnext.collection.d.ts", lib_esnext_collection);
// libFiles.set("lib.esnext.decorators.d.ts", lib_esnext_decorators);
// libFiles.set("lib.esnext.disposable.d.ts", lib_esnext_disposable);
// libFiles.set("lib.esnext.d.ts", lib_esnext);
// libFiles.set("lib.esnext.error.d.ts", lib_esnext_error);
// libFiles.set("lib.esnext.float16.d.ts", lib_esnext_float16);
// libFiles.set("lib.esnext.full.d.ts", lib_esnext_full);
// libFiles.set("lib.esnext.intl.d.ts", lib_esnext_intl);
// libFiles.set("lib.esnext.iterator.d.ts", lib_esnext_iterator);
// libFiles.set("lib.esnext.promise.d.ts", lib_esnext_promise);
// libFiles.set("lib.esnext.sharedmemory.d.ts", lib_esnext_sharedmemory);
// libFiles.set("lib.scripthost.d.ts", lib_scripthost);
// libFiles.set("lib.webworker.asynciterable.d.ts", lib_webworker_asynciterable);
// libFiles.set("lib.webworker.d.ts", lib_webworker);
// libFiles.set("lib.webworker.importscripts.d.ts", lib_webworker_importscripts);
// libFiles.set("lib.webworker.iterable.d.ts", lib_webworker_iterable);

// --- Create a reusable compiler service ---

const createCompilerService = (options: ts.CompilerOptions) => {
    const files: Record<string, { text: string; version: number }> = {};

    const host: ts.LanguageServiceHost = {
        getScriptFileNames: () => Object.keys(files),
        getScriptVersion: (fileName) =>
            files[fileName]?.version.toString() ?? "0",
        getScriptSnapshot: (fileName) => {
            const file = files[fileName] ?? {
                text: libFiles.get(fileName) ?? "",
                version: 0,
            };
            if (!file.text) {
                return undefined;
            }
            return ts.ScriptSnapshot.fromString(file.text);
        },
        getCurrentDirectory: () => "",
        getCompilationSettings: () => options,
        getDefaultLibFileName: (opts) => ts.getDefaultLibFileName(opts),
        fileExists: (fileName) =>
            files[fileName] !== undefined || libFiles.has(fileName),
        readFile: (fileName) =>
            (files[fileName] ?? libFiles.get(fileName)) as string | undefined,
    };

    const languageService = ts.createLanguageService(
        host,
        ts.createDocumentRegistry(),
    );

    return {
        updateFile(fileName: string, text: string) {
            const version = (files[fileName]?.version ?? 0) + 1;
            files[fileName] = { text, version };
        },
        getDiagnostics(fileName: string) {
            return languageService
                .getSyntacticDiagnostics(fileName)
                .concat(languageService.getSemanticDiagnostics(fileName));
        },
    };
};

// --- Initialize the service ---

const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.ES2015,
    strict: false,
};

const service = createCompilerService(compilerOptions);
const typeDef = `
    import user_snippets from "/user_snippets";
    ${snippet_signature}
    const _check: SnippetSignature[] = user_snippets;
`;
service.updateFile("/type_def.ts", typeDef);
const typeDef2 = `
        ${snippet_signature}
        export function defineSnippets(snippets: SnippetSignature[]): SnippetSignature[] {
            return snippets;
        }
`;
service.updateFile("/snippet_leaf.ts", typeDef2);

export function compiler(source_file: string) {
    // Update files in the service
    service.updateFile("/user_snippets.ts", source_file);

    // Get diagnostics
    const diagnostics = service.getDiagnostics("/type_def.ts");
    const user_diagnostics = service.getDiagnostics("/user_snippets.ts");
    user_diagnostics.filter(
        (d: ts.Diagnostic) => d.category === ts.DiagnosticCategory.Error,
    );
    return [...diagnostics, ...user_diagnostics];
}
