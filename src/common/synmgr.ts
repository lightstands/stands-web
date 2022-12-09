import { ClientConfig, Session } from "lightstands-js";
import { createSignal, onCleanup, onMount } from "solid-js";
import { resetTags, syncTags } from "../stores/tags";
import { settingStore } from "../stores/settings";
import { resetFeedLists, syncAllFeedLists } from "../stores/feedlists";
import { useClient } from "../client";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";

export type TaskNames = "tags" | "feedlists";

const workingTasksSig = createSignal<TaskNames[]>([]);

export const getWorkingTasks = workingTasksSig[0];
const setWorkingTasks = workingTasksSig[1];

const workingErrorsSig = createSignal<Record<TaskNames, Error | undefined>>({
    tags: undefined,
    feedlists: undefined,
});
export const getWorkingErrors = workingErrorsSig[0];
const setWorkingErrors = workingErrorsSig[1];

function setWorkingError(task: TaskNames, err?: Error) {
    setWorkingErrors((old) => {
        const newRec = { ...old };
        newRec[task] = err;
        return newRec;
    });
}

async function runTagSync(client: ClientConfig, session: Session) {
    await syncTags(client, session)
        .catch((e) => setWorkingError("tags", e))
        .finally(() =>
            setWorkingTasks((old) => old.filter((v) => v !== "tags"))
        );
}

async function runFeedListSync(client: ClientConfig, session: Session) {
    await syncAllFeedLists(client, session)
        .catch((e) => setWorkingError("feedlists", e))
        .finally(() =>
            setWorkingTasks((old) => old.filter((v) => v !== "feedlists"))
        );
}

export async function doSync(
    client: ClientConfig,
    session: Session,
    name?: TaskNames
) {
    const tasks = [];
    if (name === "tags") {
        setWorkingTasks((old) => [...old, "tags"]);
        tasks.push(runTagSync(client, session));
    } else if (name === "feedlists") {
        setWorkingTasks((old) => [...old, "feedlists"]);
        tasks.push(runFeedListSync(client, session));
    } else {
        setWorkingTasks((old) => [...old, "tags", "feedlists"]);
        tasks.push(runTagSync(client, session));
        tasks.push(runFeedListSync(client, session));
    }

    try {
        await Promise.all(tasks);
    } finally {
        settingStore.setKey("lastTimeSync", new Date().getTime());
    }
}

async function setupTaskPromise(promise: Promise<unknown>, task: TaskNames) {
    try {
        try {
            return await promise;
        } catch (e) {
            return setWorkingError(task, e as Error | undefined);
        }
    } finally {
        return setWorkingTasks((old) => old.filter((v) => v !== task));
    }
}

export async function resetData() {
    setWorkingTasks((old) => [...old, "tags", "feedlists"]);
    try {
        await Promise.all([
            setupTaskPromise(resetTags(), "tags"),
            setupTaskPromise(resetFeedLists(), "feedlists"),
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
export function triggerSync(tasks: TaskNames[]) {
    const client = useClient();
    const session = useStore(currentSessionStore);
    let timerId: number | undefined = undefined;

    const handler = () => {
        for (const task of tasks) {
            doSync(client, session()!.session, task);
        }
    };

    onMount(() => {
        if (session()) {
            if (
                new Date().getTime() - settingStore.get().lastTimeSync >
                1000 * 60 * 5
            ) {
                handler();
            }
            timerId = window.setInterval(handler, 1000 * 60 * 10);
        }
    });

    onCleanup(() => {
        window.clearInterval(timerId);
    });
}
