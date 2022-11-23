/** The abstraction layer for platform permission of "persistent-storage" */
import { isPermissionSupported, usePermission } from "./utils";
import { Accessor, createSignal } from "solid-js";

function supportsStorageManager() {
    return !!navigator.storage;
}

export function supportsPersistentStorage() {
    return (
        supportsStorageManager() &&
        !!navigator.storage.persist &&
        !!navigator.storage.persisted
    );
}

export async function isStoragePersistent() {
    if (supportsPersistentStorage()) {
        return await navigator.storage.persisted();
    } else {
        return false;
    }
}

/** A wrapping function to work with persistent storage permission.
 *
 * Note. If the platform does not support the Permission API, the state will never be "denied".
 * Keep in mind when designing UX.
 */
export function usePersistentStoragePermission(): Accessor<PermissionState> {
    if (isPermissionSupported()) {
        return usePermission({ name: "persistent-storage" });
    } else {
        const [get, set] = createSignal<PermissionState>("prompt");
        if (supportsPersistentStorage()) {
            isStoragePersistent().then((value) =>
                set(value ? "granted" : "prompt")
            );
        } else {
            set("denied");
        }
        return get;
    }
}

export async function requestPersistentStorage() {
    if (supportsPersistentStorage()) {
        return await navigator.storage.persist();
    }
}
