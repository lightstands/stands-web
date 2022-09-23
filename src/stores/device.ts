// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { v4 as uuidv4 } from "uuid";
import { atom, onMount, action } from "nanostores";

const storage = window.localStorage;

const KEY = "stands-web.device-id";

export const deviceIdStore = atom("");

export const reset = action(deviceIdStore, "reset", (store) => {
    const newId = uuidv4();
    store.set(newId);
    storage.setItem(KEY, newId);
});

onMount(deviceIdStore, () => {
    const value = storage.getItem(KEY);
    if (value === null) {
        reset();
    } else {
        deviceIdStore.set(value);
    }
});
