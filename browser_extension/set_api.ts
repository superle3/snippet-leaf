import { api } from "src/snippets/luasnip_api";
import type { CodeMirrorExt } from "./set_codemirror_objects";

declare global {
    var __snippet_leaf_api: ReturnType<typeof set_api>;
}
export function set_api(codemirror_objects: CodeMirrorExt) {
    const obj = {
        ...api({}),
        ...codemirror_objects,
    };
    globalThis.__snippet_leaf_api = obj;
    return obj;
}
