import {
    Box,
    ListItemText,
    ListItem,
    ListSubheader,
    Paper,
    Typography,
    ListItemButton,
    ListItemIcon,
    List,
    ListItemSecondaryAction,
} from "@suid/material";
import { Component, createResource, Show } from "solid-js";
import { useStore } from "@nanostores/solid";
import { formatDistance, formatDuration } from "date-fns";

import { Sync as SyncIcon } from "@suid/icons-material";

import SharedAppBar from "../common/SharedAppBar";
import ToolbarTitle from "../common/ToolbarTitle";
import CommonStyle from "../common/Style.module.css";
import { useCurrentTime } from "../common/utils";
import { settingStore } from "../stores/settings";
import SettingListInject from "./setting-list-inject.css?inline";
import { forcedFullSync, getWorkingTasks } from "../common/synmgr";
import { useClient } from "../client";
import { currentSessionStore } from "../stores/session";
import { useDateFnLocale, useI18n } from "../platform/i18n";

// Compatibility table see https://devdocs.io/dom/storagemanager
function isOverviewSupported() {
    return !!(navigator.storage && navigator.storage.estimate);
}

const StoragePage: Component = () => {
    const settings = useStore(settingStore);
    const client = useClient();
    const session = useStore(currentSessionStore);
    const currentTime = useCurrentTime(60 * 1000);
    const [t] = useI18n();
    const dateFnLocale = useDateFnLocale();
    const [storageEstimate] = createResource(() => {
        if (isOverviewSupported()) {
            return navigator.storage.estimate();
        }
    });

    const getOverviewString = () => {
        if (storageEstimate.loading) {
            return t("storageOverviewWorking");
        } else {
            if (storageEstimate.error) {
                return t("storageOverviewError", {
                    errName: storageEstimate.error.name || "Unknown",
                });
            } else {
                const est = storageEstimate();
                if (est) {
                    if (
                        typeof est.quota !== "undefined" &&
                        typeof est.usage !== "undefined"
                    ) {
                        const percentage = (est.usage / est.quota) * 100;
                        if (percentage < 1) {
                            return t("storageLess1PaUsed");
                        } else {
                            return t("storageUsed", {
                                n: percentage.toFixed(1),
                            });
                        }
                    } else {
                        return t("overviewUnavailable");
                    }
                } else {
                    return t("overviewUnavailable");
                }
            }
        }
    };

    const getUpdatedAtExplain = (lastTimeSync: number) => {
        if (lastTimeSync === 0) {
            return t("updatedNever");
        } else {
            return t("updatedAt", {
                dt: formatDistance(settings().lastTimeSync, currentTime(), {
                    addSuffix: true,
                    locale: dateFnLocale(),
                }),
            });
        }
    };

    const triggerFullSync = () => {
        forcedFullSync(client, session()!.session);
    };
    return (
        <Box>
            <SharedAppBar>
                <ToolbarTitle primary={t("storage")} />
            </SharedAppBar>
            <style>{SettingListInject}</style>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <List class="SettingList">
                    <Show when={isOverviewSupported()}>
                        <ListSubheader>{t("overview")}</ListSubheader>
                        <Paper>
                            <ListItem divider>
                                <ListItemText primary={getOverviewString()} />
                            </ListItem>
                        </Paper>
                    </Show>

                    <ListSubheader>{t("autoDownload")}</ListSubheader>
                    <Paper>
                        <ListItem divider>
                            <ListItemText primary={t("metadata")} />
                            <ListItemSecondaryAction>
                                <Typography>
                                    {t("syncPeriodInApp", {
                                        period: formatDuration(
                                            { minutes: 30 },
                                            { locale: dateFnLocale() }
                                        ),
                                    })}
                                </Typography>
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Show when={!!session()}>
                            <ListItemButton
                                disabled={getWorkingTasks().length > 0}
                                divider
                                onClick={triggerFullSync}
                            >
                                <ListItemIcon>
                                    <SyncIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        getWorkingTasks().length > 0
                                            ? t("syncWorking")
                                            : t("fullSyncAction")
                                    }
                                />
                            </ListItemButton>
                        </Show>
                    </Paper>
                    <Typography>
                        {t("dataAutoUpdateTip")}{" "}
                        {getUpdatedAtExplain(settings().lastTimeSync)}
                    </Typography>
                </List>
            </Box>
        </Box>
    );
};

export default StoragePage;
