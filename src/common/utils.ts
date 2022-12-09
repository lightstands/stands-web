// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { liveQuery } from "dexie";
import { Accessor, createSignal, from, onCleanup, onMount } from "solid-js";

export function error2explain(e: Error): string {
    const value =
        e.name +
        ": " +
        e.message +
        (e.stack ? "\nStacktrace:\n" + e.stack : "") +
        (e.cause ? "\nCause:\n" + e.cause : "");
    return value.replace("\n", "\n\n");
}

export function usePermission(
    desc: PermissionDescriptor
): Accessor<PermissionState> {
    const [status, setStatus] = createSignal<PermissionState>("prompt");

    let query: PermissionStatus | undefined;

    const onStateChanged = () => {
        setStatus(query!.state);
    };

    onMount(() => {
        navigator.permissions.query(desc).then((q) => {
            query = q;
            setStatus(q.state);
            query.addEventListener("change", onStateChanged);
        });
    });

    onCleanup(() => {
        if (query) {
            query.removeEventListener("change", onStateChanged);
        }
    });

    return status;
}

export function useLiveQuery<T>(
    querier: () => T | Promise<T>
): Accessor<T | undefined> {
    return from(liveQuery<T>(querier));
}

export function useCurrentTime(updatePeriod: number): Accessor<Date> {
    const [time, setTime] = createSignal<Date>(new Date());
    let timerId: number | undefined;
    onMount(() => {
        timerId = window.setInterval(() => setTime(new Date()), updatePeriod);
    });

    onCleanup(() => {
        clearInterval(timerId);
    });

    return time;
}

export function isPermissionSupported() {
    return !!(navigator.permissions && navigator.permissions.query);
}
