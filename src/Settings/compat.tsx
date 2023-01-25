import {
    Box,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    ListSubheader,
    Paper,
    Switch,
} from "@suid/material";
import { Component, from, ParentComponent, Show, splitProps } from "solid-js";
import { SwitchProps } from "@suid/material/Switch";

import SharedAppBar from "../common/SharedAppBar";
import SettingListInject from "./setting-list-inject.css?inline";
import CommonStyle from "../common/Style.module.css";
import { setAppSetting, useAppSettings } from "../stores/settings";
import { useI18n } from "../platform/i18n";
import {
    observePersistentStoragePermission,
    requestPersistentStorage,
} from "../platform/perm/storage";
import supportsPersistentStorage from "../platform/feature/persistent-storage";

const ListSwitchItem: ParentComponent<SwitchProps> = (props) => {
    const [selfProps, ariaProps, switchProps] = splitProps(
        props,
        ["children"],
        ["aria-labelledby", "aria-labelledby"]
    );
    return (
        <ListItem {...ariaProps}>
            {selfProps.children}
            <ListItemSecondaryAction>
                <Switch {...switchProps} />
            </ListItemSecondaryAction>
        </ListItem>
    );
};

const CompatPage: Component = () => {
    const appSettings = useAppSettings();
    const [t] = useI18n();
    const persistentStoragePerm = from(observePersistentStoragePermission());
    return (
        <>
            <SharedAppBar title={t("compatOptsEntry")} />
            <style>{SettingListInject}</style>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <List class="SettingList">
                    <ListSubheader id="compat-grp-sharing">
                        {t("compatSharingTitle")}
                    </ListSubheader>
                    <Paper aria-aria-labelledby="compat-grp-sharing">
                        <ListSwitchItem
                            aria-labelledby="compat-always-alt-sharing"
                            checked={
                                typeof navigator.share === "undefined" ||
                                appSettings().systemSharing === "never"
                            }
                            disabled={typeof navigator.share === "undefined"}
                            onChange={(ev) => {
                                setAppSetting(
                                    "systemSharing",
                                    !ev.target.checked ? "never" : "auto"
                                );
                            }}
                        >
                            <ListItemText
                                primary={t("alwaysAltShare")}
                                secondary={
                                    typeof navigator.share !== "undefined"
                                        ? t("alwaysAltShareExplain")
                                        : t("noSysShareErr")
                                }
                                primaryTypographyProps={{
                                    id: "compat-always-alt-sharing",
                                }}
                            />
                        </ListSwitchItem>
                    </Paper>

                    <Show when={supportsPersistentStorage()}>
                        <ListSubheader id="compat-grp-storage">
                            {t("storage", undefined, "Storage")}
                        </ListSubheader>
                        <Paper aria-aria-labelledby="compat-grp-storage">
                            <ListSwitchItem
                                disabled={
                                    typeof persistentStoragePerm() ===
                                        "undefined" ||
                                    persistentStoragePerm() === "granted"
                                }
                                checked={persistentStoragePerm() === "granted"}
                                onChange={(ev) => {
                                    if (!ev.currentTarget.checked) {
                                        return requestPersistentStorage();
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={t("persistentStorage")}
                                    secondary={t("persistentStorageExplain")}
                                />
                            </ListSwitchItem>
                        </Paper>
                    </Show>
                </List>
            </Box>
        </>
    );
};

export default CompatPage;
