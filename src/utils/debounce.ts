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
