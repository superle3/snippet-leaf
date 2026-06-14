import type { Snippet } from "codemirror_extension/codemirror_extensions";
import type { SnippetType } from "src/snippets/snippets";

declare global {
    interface String {
        contains: typeof String.prototype.includes;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Array<T> {
        contains: typeof Array.prototype.includes;
    }
}

String.prototype.contains = String.prototype.includes;
Array.prototype.contains = Array.prototype.includes;
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: Partial<HTMLElementTagNameMap[K]> & {
        cls?: string | string[];
        text?: string;
        children?: HTMLElement[];
    },
    callback?: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K];
export function createElement(
    tag: string,
    options?: Partial<HTMLElement> & {
        cls?: string | string[];
        text?: string;
        children?: HTMLElement[];
    },
    callback?: (el: HTMLElement) => void,
): HTMLElement;
export function createElement(
    tag: string,
    options?: Partial<HTMLElement> & {
        cls?: string | string[];
        text?: string;
        children?: HTMLElement[];
    },
    callback?: (el: HTMLElement) => void,
) {
    const el = document.createElement(tag);
    if (options) {
        const { cls, text, children, ...rest } = options;
        Object.assign(el, rest);
        if (cls) {
            if (Array.isArray(cls)) {
                el.classList.add(...cls);
            } else {
                el.classList.add(cls);
            }
        }
        if (text) {
            el.textContent = text;
        }
        if (children) {
            children.forEach((child) => el.appendChild(child));
        }
    }
    callback?.(el);
    return el;
}

/**
 * A standard debounce function.
 *
 * @param cb - The function to call.
 * @param timeout - The timeout to wait.
 * @param resetTimer - Whether to reset the timeout when the debouncer is called again.
 * @returns a debounced function that takes the same parameter as the original function.
 * @public
 */
export function debounce<T extends unknown[]>(
    cb: (...args: [...T]) => unknown,
    timeout: number = 0,
    resetTimer?: boolean,
): Debouncer<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cached_args: [...T] | null = null;

    const debounced = (...args: [...T]) => {
        if (timer) {
            if (resetTimer) clearTimeout(timer);
            else return;
        }
        cached_args = args;

        timer = setTimeout(() => {
            cb(...args);
            timer = null;
        }, debounced.timeout);
    };
    debounced.timeout = timeout;

    debounced.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
        cached_args = null;
        return debounced;
    };

    debounced.now = () => {
        if (timer && cached_args) {
            clearTimeout(timer);
            cb(...cached_args);
            timer = null;
            cached_args = null;
        }
        return debounced;
    };

    return debounced;
}

/** @public */
export interface Debouncer<T extends unknown[]> {
    /** @public */
    (...args: [...T]): void;
    /** @public */
    cancel(): this;
    now(): this;
    timeout: number;
}

class Notice {
    constructor(
        public content: string | DocumentFragment,
        public timeout: number,
    ) {}

    hide() {}
}
abstract class NoticeLike {
    abstract hide(): void;
}

type NoticeCallback = (
    content: string | DocumentFragment,
    timeout: number,
) => void;
function createNoticeManager(): NoticeCallback {
    let lastNotice: NoticeLike | null = null;

    const lastNoticeFunc = (
        content: string | DocumentFragment,
        timeout: number,
    ) => {
        lastNotice?.hide();
        lastNotice = new Notice(content, timeout);
    };
    return lastNoticeFunc;
}

const notice = createNoticeManager();
export function showSnippetInfo(
    state: any,
    snippet: Snippet<SnippetType>,
    replacement: string,
    containsTrigger: boolean,
) {
    const fragment = new DocumentFragment();
    const message_items: (HTMLElement | string)[][] = [
        [`Description: ${snippet.description}`],
        [
            "Parsed trigger: ",
            createElement("code", { text: snippet.trigger.toString() }),
        ],
        snippet.triggerKey
            ? [
                  "Trigger key: ",
                  createElement("code", { text: snippet.triggerKey }),
              ]
            : [],
        ["Replacement", createElement("code", { text: replacement })],
        [`Auto-enlarge brackets: ${containsTrigger}`],
    ];
    const div = createElement("div", {}, (div) => {
        const textNode = document.createTextNode("Latex Suite: ");
        const br = document.createElement("br");
        div.append(textNode);
        div.appendChild(br);
        const ul = createElement("ul");
        div.appendChild(ul);
        for (const item of message_items) {
            if (item.length === 0) continue;
            const li = createElement("li");
            ul.appendChild(li);
            for (const message of item) {
                if (typeof message === "string") {
                    const textNode = document.createTextNode(message);
                    li.appendChild(textNode);
                } else {
                    li.appendChild(message);
                }
            }
        }
    });
    notice(fragment, 5000);
    console.debug(div.textContent);
}
