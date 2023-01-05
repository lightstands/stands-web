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

const CompatPage: Component = () => {
    const appSettings = useAppSettings();
    return (
        <>
            <SharedAppBar title="Compatibility" />
            <style>{SettingListInject}</style>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <List class="SettingList">
                    <ListSubheader>Sharing</ListSubheader>
                    <Paper>
                        <ListItem>
                            <ListItemText
                                primary="Always alternative sharing method"
                                secondary={
                                    typeof navigator.share !== "undefined"
                                        ? "Use alternative method instead of the system one"
                                        : "We could not provide the system sharing on this device. Another browser or operating system may help."
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
