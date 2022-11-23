import Box from "@suid/material/Box";
import List from "@suid/material/List";
import ListItem from "@suid/material/ListItem";
import ListItemText from "@suid/material/ListItemText";
import ListSubheader from "@suid/material/ListSubheader";
import Paper from "@suid/material/Paper";
import Typography from "@suid/material/Typography";
import { Component, createResource, Show } from "solid-js";
import SharedAppBar from "../common/SharedAppBar";
import ToolbarTitle from "../common/ToolbarTitle";
import CommonStyle from "../common/Style.module.css";
import Link from "@suid/material/Link";
import { useCurrentTime, useLiveQuery } from "../common/utils";
import { openDb } from "../stores/db";
import { useStore } from "@nanostores/solid";
import { settingStore } from "../stores/settings";
import { formatDistance } from "date-fns";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemIcon from "@suid/material/ListItemIcon";
import { Sync as SyncIcon } from "@suid/icons-material";
import SettingListInject from "./setting-list-inject.css?inline";
import { doSync, getWorkingTasks } from "../common/synmgr";
import { useClient } from "../client";
import { currentSessionStore } from "../stores/session";
import { supportsPersistentStorage } from "../common/storage";

const SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "petabyte"];

function formatSize(nbytes: number): string {
    for (let i = SIZE_UNITS.length - 1; i >= 0; i--) {
        const n = nbytes / Math.pow(1000, i);
        if (n > 1) {
            return `${n.toFixed(2)} ${SIZE_UNITS[i]}s`;
        }
    }
    return `${nbytes.toFixed(2)} ${SIZE_UNITS[0]}`;
}

// Compatibility table see https://devdocs.io/dom/storagemanager
function isOverviewSupported() {
    return !!(navigator.storage && navigator.storage.estimate);
}

const StoragePage: Component = () => {
    const settings = useStore(settingStore);
    const client = useClient();
    const session = useStore(currentSessionStore);
    const currentTime = useCurrentTime(60 * 1000);
    const [storageEstimate] = createResource(() => {
        if (isOverviewSupported()) {
            return navigator.storage.estimate();
        }
    });

    const tagCount = useLiveQuery(async () => {
        const db = await openDb();
        return await db.postTags.count();
    });

    const getOverviewString = () => {
        if (storageEstimate.loading) {
            return "Calculating size...";
        } else {
            if (storageEstimate.error) {
                return `Failed to collect size information (${
                    storageEstimate.error.name || "Unknown"
                }). `;
            } else {
                const est = storageEstimate();
                if (est) {
                    if (
                        typeof est.quota !== "undefined" &&
                        typeof est.usage !== "undefined"
                    ) {
                        const percentage = (est.usage / est.quota) * 100;
                        const avaliableString = `${formatSize(
                            est.quota
                        )} avaliable`;
                        if (percentage < 1) {
                            return `less than 1% used (${avaliableString})`;
                        } else {
                            return `${percentage.toFixed(
                                1
                            )}% used (${avaliableString})`;
                        }
                    } else if (typeof est.quota !== "undefined") {
                        return `${formatSize(est.quota)} avaliable`;
                    } else if (typeof est.usage !== "undefined") {
                        return `${formatSize(est.usage)} used`;
                    } else {
                        return "Overview unavaliable";
                    }
                } else {
                    return "Overview unavaliable";
                }
            }
        }
    };

    const getUpdatedAtExplain = (lastTimeSync: number) => {
        if (lastTimeSync === 0) {
            return "Never updated with LightStands";
        } else {
            return `Updated ${formatDistance(
                settings().lastTimeSync,
                currentTime(),
                { addSuffix: true }
            )}`;
        }
    };
    return (
        <Box>
            <SharedAppBar>
                <ToolbarTitle primary="Storage" />
            </SharedAppBar>
            <style>{SettingListInject}</style>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <List class="SettingList">
                    <Show when={isOverviewSupported()}>
                        <ListSubheader>
                            <Typography>Overview</Typography>
                        </ListSubheader>
                        <Paper>
                            <ListItem divider>
                                <ListItemText primary={getOverviewString()} />
                            </ListItem>
                        </Paper>
                        <Typography>
                            The number here may significantly differ from the
                            actual number due to privacy concern and other
                            reasons.
                            <Link href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API#quotas_and_usage_estimates">
                                Learn more about why the number is different...
                            </Link>
                        </Typography>
                    </Show>

                    <ListSubheader>
                        <Typography>Tags</Typography>
                    </ListSubheader>
                    <Paper>
                        <ListItem divider>
                            <ListItemText
                                primary={`${tagCount()} tag${
                                    tagCount() && tagCount()! > 1 ? "s" : ""
                                } stored on this device`}
                            />
                        </ListItem>
                    </Paper>

                    <Paper>
                        <ListItem divider>
                            <ListItemText>
                                {getUpdatedAtExplain(settings().lastTimeSync)}
                            </ListItemText>
                        </ListItem>
                        <Show when={!!session()}>
                            <ListItemButton
                                disabled={getWorkingTasks().length > 0}
                                divider
                                onClick={() =>
                                    doSync(client, session()!.session)
                                }
                            >
                                <ListItemIcon>
                                    <SyncIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        getWorkingTasks().length > 0
                                            ? "Working..."
                                            : "Sync with LightStands"
                                    }
                                />
                            </ListItemButton>
                        </Show>
                    </Paper>
                    <Typography>
                        LightStands for Web can automatically keep the data up
                        to date. You may trigger synchronisation manually when
                        you believe something went wrong.
                    </Typography>
                    <Show when={!supportsPersistentStorage()}>
                        <Typography>
                            The browser does not support persistent storage,
                            your data may frequently be wiped.
                        </Typography>
                    </Show>
                </List>
            </Box>
        </Box>
    );
};

export default StoragePage;
