import isIdleCallbackSupported from "./feature/idle-callback";

/**
 * Compatibility wrapper of `window.requestIdleCallback`, fallback to `window.setTimeout` if available.
 *
 * @param fn
 * @param opts
 * @returns the handle of `window.requestIdleCallback` or `window.setTimeout`.
 */
export function requestIdleCallback(
    fn: () => void,
    opts?: { timeout?: number }
): number {
    if (isIdleCallbackSupported()) {
        return window.requestIdleCallback(fn, opts);
    } else {
        return window.setTimeout(
            fn,
            typeof opts?.timeout !== "undefined"
                ? Math.min(opts.timeout, 220)
                : 220
        );
    }
}
/**
 * Compatibility wrapper of `window.cancelIdleCallback`, fallback to `window.clearTimeout` if available.
 *
 * WARN: Do not use monkey patch for `window.requestIdleCallback` with this function.
 * This function detect the usable function at runtime
 * (that should be a low cost operation since it's just check if two functions defined),
 * and this function may use wrong function for the handle.
 * @param handle
 */
export function cancelIdleCallback(handle: number) {
    if (isIdleCallbackSupported()) {
        window.cancelIdleCallback(handle);
    } else {
        window.clearTimeout(handle);
    }
}
