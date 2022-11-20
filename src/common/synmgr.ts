import { ClientConfig, Session } from "lightstands-js";
import { createSignal } from "solid-js";
import { syncTags } from "../stores/tags";

export type TaskNames = "tags";

const workingTasksSig = createSignal<TaskNames[]>([]);

export const getWorkingTasks = workingTasksSig[0];
const setWorkingTasks = workingTasksSig[1];

const workingErrorsSig = createSignal<Record<TaskNames, Error | undefined>>({
    tags: undefined,
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

export async function doSync(client: ClientConfig, session: Session) {
    setWorkingTasks((old) => [...old, "tags"]);
    await Promise.all([
        syncTags(client, session)
            .catch((e) => setWorkingError("tags", e))
            .finally(() =>
                setWorkingTasks((old) => old.filter((v) => v !== "tags"))
            ),
    ]);
}
