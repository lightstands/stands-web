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
import { Component } from "solid-js";

import SharedAppBar from "../common/SharedAppBar";
import SettingListInject from "./setting-list-inject.css?inline";
import CommonStyle from "../common/Style.module.css";
import { setAppSetting, useAppSettings } from "../stores/settings";
import { useI18n } from "../platform/i18n";

const CompatPage: Component = () => {
    const appSettings = useAppSettings();
    const [t] = useI18n();
    return (
        <>
            <SharedAppBar title={t("compatOptsEntry")} />
            <style>{SettingListInject}</style>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <List class="SettingList">
                    <ListSubheader>{t("compatSharingTitle")}</ListSubheader>
                    <Paper>
                        <ListItem>
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
                                secondaryTypographyProps={{
                                    maxWidth: "calc(100% - 64px)",
                                }}
                            />
                            <ListItemSecondaryAction>
                                <Switch
                                    aria-labelledby="compat-always-alt-sharing"
                                    checked={
                                        typeof navigator.share ===
                                            "undefined" ||
                                        appSettings().systemSharing === "never"
                                    }
                                    disabled={
                                        typeof navigator.share === "undefined"
                                    }
                                    onChange={(ev) => {
                                        setAppSetting(
                                            "systemSharing",
                                            !ev.target.checked
                                                ? "never"
                                                : "auto"
                                        );
                                    }}
                                />
                            </ListItemSecondaryAction>
                        </ListItem>
                    </Paper>
                </List>
            </Box>
        </>
    );
};

export default CompatPage;
