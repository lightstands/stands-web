/** The abstraction layer for platform permission of "persistent-storage" */
import { cancelIdleCallback, requestIdleCallback } from "../idle-callback";
import supportsPersistentStorage from "../feature/persistent-storage";

export async function isStoragePersistent() {
    if (supportsPersistentStorage()) {
        return await navigator.storage.persisted();
    } else {
        return false;
    }
}

function altPersistentStoragePermObservable() {
    return {
        subscribe(callback: (val: PermissionState) => void) {
            let handle: number | undefined;
            const requestValueUpdate = () => {
                handle = requestIdleCallback(
                    () => {
                        navigator.storage.persisted().then((ret) => {
                            callback(ret ? "granted" : "prompt");
                        });
                        requestValueUpdate();
                    },
                    { timeout: 2000 }
                );
            };
            requestValueUpdate()
            return () => {
                if (typeof handle !== "undefined") {
                    cancelIdleCallback(handle);
                }
            };
        },
    };
}

export function observePersistentStoragePermission() {
    return altPersistentStoragePermObservable();
}

export async function requestPersistentStorage() {
    if (supportsPersistentStorage()) {
        return await navigator.storage.persist();
    }
}
