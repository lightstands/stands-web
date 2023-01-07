import { persistentMap } from "@nanostores/persistent";
import { useStore } from "@nanostores/solid";
import { Settings } from "@suid/icons-material";
import { Get } from "nanostores/map";

interface Settings {
    ignorePermissionTip: boolean;
    lastTimeSync: number;
    feedDefaultFilterTag: string;
    systemSharing: "auto" | "never";
    appLang: "xauto" | string;
}

export const settingStore = persistentMap<Settings>(
    "stands-web.settings::",
    {
        ignorePermissionTip: false,
        lastTimeSync: 0,
        feedDefaultFilterTag: "!_read",
        systemSharing: "auto",
        appLang: "xauto",
    },
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);

export function setAppSetting<K extends keyof Settings>(
    key: K,
    value: Get<Settings, K>
) {
    settingStore.setKey(key, value);
}

export function useAppSettings() {
    return useStore(settingStore);
}
