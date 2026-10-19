import type { ViewUpdate } from "@codemirror/view";

export type UpdateHandler = (ctx: unknown, update: ViewUpdate) => void;
