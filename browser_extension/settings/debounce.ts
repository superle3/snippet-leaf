/**
 * duplicated from obsidian_utils.ts, the viewplugin and statfield cause the whole module to be loaded instead of individual functions, causing import issues for settings_tab.ts
 */

/**
 * A standard debounce function.
 *
 * @param cb - The function to call.
 * @param timeout - The timeout to wait.
 * @param resetTimer - Whether to reset the timeout when the debouncer is called again.
 * @returns a debounced function that takes the same parameter as the original function.
 * @public
 */
export function debounce<T extends unknown[], V>(
    cb: (...args: [...T]) => V,
    timeout: number = 0,
    resetTimer?: boolean,
): Debouncer<T, void> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cached_args: [...T] | null = null;

    const debounced = (...args: [...T]): void => {
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
export interface Debouncer<T extends unknown[], V> {
    /** @public */
    (...args: [...T]): V;
    /** @public */
    cancel(): this;
    now(): this;
    timeout: number;
}
