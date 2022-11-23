import Box from "@suid/material/Box";
import List from "@suid/material/List";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemText from "@suid/material/ListItemText";
import ListSubheader from "@suid/material/ListSubheader";
import Paper from "@suid/material/Paper";
import Typography from "@suid/material/Typography";
import { Component, createResource, createSignal, lazy, Show } from "solid-js";
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
import ListItem from "@suid/material/ListItem";
import {
    OpenInNew as OpenInNewIcon,
    Logout as LogoutIcon,
} from "@suid/icons-material";
import { useNavigate } from "@solidjs/router";
import { formatDistanceToNow } from "date-fns";
import { isPermissionSupported, usePermission } from "../common/utils";
import SettingListInject from "./setting-list-inject.css?inline";
import AdvMenu from "../common/AdvMenu";
import { ListItemIcon } from "@suid/material";

const SetPasswordDlg = lazy(() => import("./SetPasswordDlg"));

const SettingsPage: Component = () => {
    const client = useClient();
    const session = useStore(currentSessionStore);
    const navigate = useNavigate();
    const storagePermission = isPermissionSupported()
        ? usePermission({ name: "persistent-storage" })
        : () => "denied";
    const [openSetPassword, setOpenSetPassword] = createSignal(false);
    const [userPrivateInfo] = createResource(
        (): [ClientConfig, { session: Session } | undefined] => [
            client,
            session(),
        ],
        async ([client, session]) => {
            if (session) {
                try {
                    return await aunwrap(
                        getUserPrivateInfo(
                            client,
                            session.session,
                            session.session.accessTokenObject.userid
                        )
                    );
                } catch (e) {
                    return undefined;
                }
            }
        }
    );
    return (
        <>
            <SharedAppBar title="Settings">
                <AdvMenu
                    totalIconNumber={1}
                    expanded={[]}
                    onExpandedIconNumberChanged={() => {}}
                    hidden={[
                        <ListItemButton onClick={() => navigate("/sign-out")}>
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Sign out..." />
                        </ListItemButton>,
                    ]}
                />
            </SharedAppBar>
            <Show when={openSetPassword()}>
                <SetPasswordDlg
                    open={openSetPassword()}
                    onClose={() => setOpenSetPassword((prev) => !prev)}
                />
            </Show>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <style>{SettingListInject}</style>
                <List class="SettingList">
                    <ListSubheader>
                        <Typography>Account & Security</Typography>
                    </ListSubheader>
                    <Paper>
                        <ListItemButton
                            disabled={
                                userPrivateInfo.loading ||
                                typeof userPrivateInfo() === "undefined" ||
                                true
                            }
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
                            disabled={
                                userPrivateInfo.loading ||
                                typeof userPrivateInfo() === "undefined" ||
                                true
                            }
                            divider
                        >
                            <ListItemText
                                primary="Use another username"
                                secondary={userPrivateInfo()?.username || "..."}
                            />
                        </ListItemButton>
                        <Show
                            when={session()?.session.accessTokenObject.scope.includes(
                                "user.change_password"
                            )}
                        >
                            <ListItemButton
                                onClick={() => setOpenSetPassword(true)}
                            >
                                <ListItemText primary="Set new password" />
                            </ListItemButton>
                        </Show>
                    </Paper>
                    <Paper>
                        <Show when={storagePermission() === "prompt"}>
                            <ListItemButton divider>
                                <ListItemText primary="Grant persistent storage permission" />
                            </ListItemButton>
                        </Show>

                        <ListItemButton
                            divider
                            onClick={() => navigate("/settings/storage")}
                        >
                            <ListItemText primary="Storage" />
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
                                secondary={
                                    /* @once */ `${
                                        import.meta.env.PACKAGE_VERSION
                                    } (updated ${formatDistanceToNow(
                                        new Date(import.meta.env.BUILD_AT)
                                    )})`
                                }
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
