import { ClientConfig, Session } from "lightstands-js";
import { createSignal, onCleanup, onMount } from "solid-js";
import { useStore } from "@nanostores/solid";

import { resetTags, syncTags } from "../stores/tags";
import { settingStore } from "../stores/settings";
import { resetFeedLists, syncAllFeedLists } from "../stores/feedlists";
import { useClient } from "../client";
import { currentSessionStore } from "../stores/session";
import { resetFeedMetas } from "../stores/feedmeta";
import { resetPostMeta, syncAllPostMeta } from "../stores/postmeta";
import { isMeetSynTime, resetSynTime } from "../stores/lastsyn";
import { default as rootLogger } from "../logger";

const logger = rootLogger.child({ c: "common/synmgr" });

export type TaskNames = "tags" | "feedlists" | "postmeta";

const workingTasksSig = createSignal<TaskNames[]>([]);

export const getWorkingTasks = workingTasksSig[0];
const setWorkingTasks = workingTasksSig[1];

const workingErrorsSig = createSignal<
    Partial<Record<TaskNames, Error | undefined>>
>({});
export const getWorkingErrors = workingErrorsSig[0];
const setWorkingErrors = workingErrorsSig[1];

function setWorkingError(task: TaskNames, err?: Error) {
    setWorkingErrors((old) => {
        const newRec = { ...old };
        newRec[task] = err;
        return newRec;
    });
}

function setTaskWorking(tag: TaskNames) {
    setWorkingTasks((prev) => [...prev, tag]);
}

function rmTaskWorking(tag: TaskNames) {
    setWorkingTasks((prev) => prev.filter((name) => name !== tag));
}

async function setupTaskPromise<T>(promise: Promise<T>, task: TaskNames) {
    setTaskWorking(task);
    try {
        try {
            return await promise;
        } catch (e) {
            setWorkingError(task, e as Error | undefined);
        }
    } finally {
        rmTaskWorking(task);
    }
}

export async function runTagSync(client: ClientConfig, session: Session) {
    return await setupTaskPromise(syncTags(client, session), "tags");
}

export async function runFeedListSync(client: ClientConfig, session: Session) {
    return await setupTaskPromise(
        syncAllFeedLists(client, session),
        "feedlists"
    );
}

export async function runPostMetaSync(client: ClientConfig, session: Session) {
    return await setupTaskPromise(syncAllPostMeta(client), "postmeta");
}

function isSyncTaskWorking(name: TaskNames) {
    return getWorkingTasks().includes(name);
}

export function shouldRunTagSync() {
    return isMeetSynTime("tags", 30 * 60);
}

export function shouldRunFeedListSync() {
    return isMeetSynTime("feedlists", 30 * 60);
}

export function shouldRunPostMetaSync() {
    return isMeetSynTime("postmeta", 30 * 60);
}

export async function forcedFullSync(client: ClientConfig, session: Session) {
    let updatedItems = 0;
    try {
        if (!isSyncTaskWorking("feedlists")) {
            await runFeedListSync(client, session);
            updatedItems += 1;
        }
        if (!isSyncTaskWorking("postmeta")) {
            await runPostMetaSync(client, session);
            updatedItems += 1;
        }
        if (!isSyncTaskWorking("tags")) {
            await runTagSync(client, session);
            updatedItems += 1;
        }
    } finally {
        if (updatedItems === 3) {
            settingStore.setKey("lastTimeSync", new Date().getTime());
        }
    }
}

export async function resetData() {
    try {
        resetSynTime();
        await Promise.all([
            setupTaskPromise(resetTags(), "tags"),
            setupTaskPromise(resetFeedLists(), "feedlists"),
            resetFeedMetas(),
            setupTaskPromise(resetPostMeta(), "postmeta"),
        ]);
    } finally {
        settingStore.setKey("lastTimeSync", 0);
    }
}

/** Trigger synchroization if possible.
 *
 * Condition:
 * - have been 5 minutes from last sync;
 * - or have been stop 10 minutes on this page.
 *
 * @param tasks task names
 */
export function useSync() {
    const client = useClient();
    const session = useStore(currentSessionStore);
    let timerId: number | undefined = undefined;

    const handler = async () => {
        const sessionObject = session()!.session;
        let updatedItems = 0;
        try {
            if (!isSyncTaskWorking("feedlists") && shouldRunFeedListSync()) {
                await runFeedListSync(client, sessionObject);
                updatedItems += 1;
            }
            if (!isSyncTaskWorking("postmeta") && shouldRunPostMetaSync()) {
                await runPostMetaSync(client, sessionObject);
                updatedItems += 1;
            }
            if (!isSyncTaskWorking("tags") && shouldRunTagSync()) {
                await runTagSync(client, sessionObject);
                updatedItems += 1;
            }
        } finally {
            if (updatedItems === 3) {
                settingStore.setKey("lastTimeSync", new Date().getTime());
            }
        }
    };

    onMount(() => {
        if (session()) {
            handler();
            timerId = window.setInterval(() => handler(), 1000 * 60 * 10);
        }
    });

    onCleanup(() => {
        window.clearInterval(timerId);
    });
}
