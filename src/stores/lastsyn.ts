/** Utils to store "last synchronisation" time */

function stringilize(s: string | string[]) {
    if (typeof s === "string") {
        return s;
    } else {
        return s.join(":");
    }
}

export type SynTag = string | string[];

const PREFIX = "stands-web.lastsyntime:";

export function setLasySynTime(tag: SynTag, time: number) {
    window.localStorage.setItem(
        `${PREFIX}${stringilize(tag)}`,
        time.toString()
    );
}

export function getLastSynTime(tag: SynTag): number {
    try {
        return Number(
            window.localStorage.getItem(`${PREFIX}${stringilize(tag)}`)
        );
    } catch {
        return 0;
    }
}

/** Check if it's scheduled time for synchronisation
 *
 * @param tag
 * @param period in seconds
 * @returns
 */
export function isMeetSynTime(tag: SynTag, period: number) {
    return (getLastSynTime(tag) + (period * 1000)) <= (new Date().getTime());
}

export function resetSynTime() {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
            keys.push(k);
        }
    }
    for (const k of keys) {
        window.localStorage.removeItem(k);
    }
}
