const CACHE: Record<string, boolean | undefined> = {};

export function memorised(k: string, fn: () => boolean) {
    return function () {
        const cached = CACHE[k];
        if (typeof cached !== "undefined") {
            return cached;
        } else {
            const value = fn();
            CACHE[k] = value;
            return value;
        }
    };
}
