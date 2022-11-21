import { persistentMap } from "@nanostores/persistent";

interface Settings {
    ignorePermissionTip: boolean;
    lastTimeSync: number;
}

export const settingStore = persistentMap<Settings>(
    "stands-web.settings::",
    {
        ignorePermissionTip: false,
        lastTimeSync: 0,
    },
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);
