import Box from "@suid/material/Box";
import List from "@suid/material/List";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemText from "@suid/material/ListItemText";
import ListSubheader from "@suid/material/ListSubheader";
import Paper from "@suid/material/Paper";
import Typography from "@suid/material/Typography";
import { Component, createResource, Show } from "solid-js";
import SharedAppBar from "../common/SharedAppBar";
import CommonStyle from "../common/Style.module.css";
import {
    aunwrap,
    ClientConfig,
    getUserPrivateInfo,
    Session,
} from "lightstands-js";
import { useClient } from "../client";
import { currentSessionStore } from "../stores/session";
import { useStore } from "@nanostores/solid";
import CircularProgress from "@suid/material/CircularProgress";
import ListItem from "@suid/material/ListItem";
import { OpenInNew as OpenInNewIcon } from "@suid/icons-material";
import { useNavigate } from "@solidjs/router";

const SettingsPage: Component = () => {
    const client = useClient();
    const session = useStore(currentSessionStore);
    const navigate = useNavigate();
    const [userPrivateInfo] = createResource(
        (): [ClientConfig, { session: Session } | undefined] => [
            client,
            session(),
        ],
        ([client, session]) => {
            if (session) {
                return aunwrap(
                    getUserPrivateInfo(
                        client,
                        session.session,
                        session.session.accessTokenObject.userid
                    )
                );
            }
        }
    );
    return (
        <>
            <SharedAppBar title="Settings" />
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <style>{`.SettingList .MuiListSubheader-root {margin-top: 4px; margin-bottom:4px;} .SettingList .MuiPaper-root {border-radius: 2px; margin-bottom: 12px}`}</style>
                <List class="SettingList">
                    <ListSubheader>
                        <Typography>
                            Account & Security
                            <Show when={userPrivateInfo.loading}>
                                <Box
                                    sx={{
                                        marginLeft: "4px",
                                        display: "inline-flex",
                                    }}
                                >
                                    <CircularProgress size="12px" />
                                </Box>
                            </Show>
                        </Typography>
                    </ListSubheader>
                    <Paper>
                        <ListItemButton
                            disabled={userPrivateInfo.loading || true}
                            divider
                        >
                            <ListItemText
                                primary={
                                    userPrivateInfo()?.email
                                        ? "Use another Email address"
                                        : "Set an Email Address"
                                }
                                secondary={userPrivateInfo()?.email}
                            />
                        </ListItemButton>
                        <ListItemButton
                            disabled={userPrivateInfo.loading || true}
                            divider
                        >
                            <ListItemText
                                primary="Use another username"
                                secondary={userPrivateInfo()?.username}
                            />
                        </ListItemButton>
                        <ListItemButton disabled>
                            <ListItemText primary="Set new password" />
                        </ListItemButton>
                    </Paper>
                    <ListSubheader>
                        <Typography>About</Typography>
                    </ListSubheader>
                    <Paper>
                        <ListItem divider>
                            <ListItemText
                                primary={
                                    import.meta.env.PROD
                                        ? "LightStands for Web"
                                        : "LightStands for Web (dev)"
                                }
                                secondary={import.meta.env.PACKAGE_VERSION}
                            />
                        </ListItem>
                        <ListItemButton divider disabled>
                            <ListItemText
                                primary="Open source licenses"
                                secondary="Coming soon"
                            />
                        </ListItemButton>
                        <ListItemButton
                            divider
                            onClick={() =>
                                window.open(
                                    "https://github.com/lightstands/stands-web/",
                                    "_blank"
                                )
                            }
                        >
                            <ListItemText
                                primary={
                                    <Typography>
                                        Source code
                                        <OpenInNewIcon fontSize="inherit" />
                                    </Typography>
                                }
                            />
                        </ListItemButton>
                        <ListItemButton
                            divider
                            onClick={() =>
                                window.open(
                                    "https://www.gnu.org/licenses/agpl-3.0.en.html",
                                    "_blank"
                                )
                            }
                        >
                            <ListItemText
                                primary={
                                    <Typography>
                                        This software is free software
                                        <OpenInNewIcon fontSize="inherit" />
                                    </Typography>
                                }
                                secondary="Licensed by Affero Gernal Public License, version 3 or later"
                            />
                        </ListItemButton>
                        <Show when={import.meta.env.DEV}>
                            <ListItemButton onClick={() => navigate("/_dev/")}>
                                <ListItemText primary="Development Tools" />
                            </ListItemButton>
                        </Show>
                    </Paper>
                </List>
            </Box>
        </>
    );
};

export default SettingsPage;
