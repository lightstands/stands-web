import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListSubheader,
    Paper,
    Typography,
} from "@suid/material";
import { Component, Show } from "solid-js";

import SharedAppBar from "../common/SharedAppBar";
import SettingListInject from "./setting-list-inject.css?inline";
import CommonStyle from "../common/Style.module.css";
import { useServiceWorker } from "../common/swbridge";

const OfflinePage: Component = () => {
    const {
        offlineReady: [offlineReady],
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useServiceWorker();
    return (
        <>
            <SharedAppBar title="Offline Experience" />
            <style>{SettingListInject}</style>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <List class="SettingList">
                    <ListSubheader>
                        <Typography>Status</Typography>
                    </ListSubheader>
                    <Paper>
                        <ListItem>
                            <ListItemText
                                primary={
                                    offlineReady()
                                        ? "Offline is ready"
                                        : "Offline unavailable"
                                }
                            />
                        </ListItem>
                    </Paper>
                    <Show
                        when={offlineReady()}
                        fallback={
                            <Typography>
                                This application can provide offline experience
                                when your browser is ready.
                            </Typography>
                        }
                    >
                        <Typography>
                            This application can be used without Internet. Some
                            features may be limited.
                        </Typography>
                    </Show>

                    <Show when={needRefresh()}>
                        <Paper>
                            <ListItemButton
                                onClick={() => updateServiceWorker()}
                            >
                                <ListItemText primary="Refresh to upgrade" />
                            </ListItemButton>
                        </Paper>
                        <Typography>
                            Use this option will refresh this web page and
                            upgrade to the new version of the application.
                        </Typography>
                    </Show>
                </List>
            </Box>
        </>
    );
};

export default OfflinePage;
