/** Utils to store "last synchronisation" time */

function stringilize(s: string | string[]) {
    if (typeof s === "string") {
        return s;
    } else {
        return s.join(":");
    }
}

export type SynTag = string | string[];

export function setLasySynTime(tag: SynTag, time: number) {
    window.localStorage.setItem(
        `stands-web.lastsyntime:${stringilize(tag)}`,
        time.toString()
    );
}

export function getLastSynTime(tag: SynTag): number {
    try {
        return Number(
            window.localStorage.getItem(
                `stands-web.lastsyntime:${stringilize(tag)}`
            )
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
    return getLastSynTime(tag) + period * 1000 <= new Date().getTime();
}
