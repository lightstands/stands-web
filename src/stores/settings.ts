import { persistentMap } from "@nanostores/persistent";

interface Settings {
    ignorePermissionTip: boolean;
    lastTimeSync: number;
    feedDefaultFilterTag: string;
}

export const settingStore = persistentMap<Settings>(
    "stands-web.settings::",
    {
        ignorePermissionTip: false,
        lastTimeSync: 0,
        feedDefaultFilterTag: "!_read",
    },
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);
