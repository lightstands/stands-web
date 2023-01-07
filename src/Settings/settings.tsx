import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    Paper,
    Typography,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
} from "@suid/material";
import {
    Component,
    createResource,
    createSignal,
    For,
    lazy,
    Show,
} from "solid-js";
import {
    aunwrap,
    ClientConfig,
    getUserPrivateInfo,
    Session,
} from "lightstands-js";
import { useStore } from "@nanostores/solid";
import { formatDistanceToNow } from "date-fns";

import {
    OpenInNew as OpenInNewIcon,
    Logout as LogoutIcon,
} from "@suid/icons-material";

import SharedAppBar from "../common/SharedAppBar";
import CommonStyle from "../common/Style.module.css";
import { useClient } from "../client";
import { currentSessionStore } from "../stores/session";
import { useNavigate } from "../common/nav";

import SettingListInject from "./setting-list-inject.css?inline";
import AdvMenu from "../common/AdvMenu";
import {
    setAppSetting,
    settingStore,
    useAppSettings,
} from "../stores/settings";
import {
    requestPersistentStorage,
    usePersistentStoragePermission,
} from "../common/storage";
import { useServiceWorker } from "../common/swbridge";
import { useScaffold } from "../common/Scaffold";
import guardSignIn from "../common/guardSignIn";
import {
    autoMatchLocale,
    SUPPORTED_LANGS,
    useI18n,
} from "../common/i18n-wrapper";

const LANG_NAMES = new Map([
    ["en", "English"],
    ["zh-Hans", "简体中文"],
]);

const SetPasswordDlg = lazy(() => import("./SetPasswordDlg"));

const SettingsPage: Component = () => {
    guardSignIn();
    const client = useClient();
    const session = useStore(currentSessionStore);
    const navigate = useNavigate();
    const storagePermission = usePersistentStoragePermission();
    const {
        updateServiceWorker,
        needRefresh: [needRefresh],
    } = useServiceWorker();
    const scaffoldCx = useScaffold();
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
    const settings = useAppSettings();
    const [t, { locale }] = useI18n();
    return (
        <>
            <SharedAppBar
                title="Settings"
                position="sticky"
                hide={scaffoldCx.state.scrollingDown}
            >
                <AdvMenu
                    expanded={[]}
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
                    <Show when={needRefresh()}>
                        <ListSubheader>New version available</ListSubheader>
                        <Paper>
                            <ListItemButton
                                onClick={() => updateServiceWorker()}
                            >
                                <ListItemText primary="Refresh to upgrade" />
                            </ListItemButton>
                        </Paper>
                    </Show>
                    <ListSubheader>Account & Security</ListSubheader>
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
                    <ListSubheader>{t("general", {}, "General")}</ListSubheader>
                    <Paper>
                        <ListItem>
                            <ListItemText
                                primary={t(
                                    "appLangTitle",
                                    {},
                                    "Application Language"
                                )}
                            />
                            <ListItemSecondaryAction>
                                <select
                                    value={settings().appLang}
                                    onChange={(ev) => {
                                        const newValue = ev.currentTarget.value;
                                        setAppSetting("appLang", newValue);
                                        if (newValue !== "xauto") {
                                            locale(newValue);
                                        } else {
                                            locale(autoMatchLocale());
                                        }
                                    }}
                                >
                                    <option value="xauto">
                                        {t(
                                            "langAuto",
                                            {
                                                langName: LANG_NAMES.get(
                                                    autoMatchLocale()
                                                )!,
                                            },
                                            "Auto ({{langName}})"
                                        )}
                                    </option>
                                    <For each={SUPPORTED_LANGS}>
                                        {(tag) => (
                                            <option value={tag}>
                                                {LANG_NAMES.get(tag)}
                                            </option>
                                        )}
                                    </For>
                                </select>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </Paper>
                    <ListSubheader>Feeds</ListSubheader>
                    <Paper>
                        <ListItem>
                            <ListItemText
                                primary="Default filter"
                                id="feed-default-filter-tag-label"
                            />
                            <ListItemSecondaryAction>
                                <select
                                    value={settings().feedDefaultFilterTag}
                                    aria-labelled-by="feed-default-filter-tag-label"
                                    onChange={(ev) => {
                                        const target =
                                            ev.target as HTMLSelectElement;
                                        settingStore.setKey(
                                            "feedDefaultFilterTag",
                                            target.value
                                        );
                                    }}
                                >
                                    <option value={""}>Unset</option>
                                    <option value={"_read"}>Read</option>
                                    <option value={"!_read"}>Unread</option>
                                </select>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </Paper>
                    <ListSubheader>Accessibility</ListSubheader>
                    <Paper>
                        <ListItemButton
                            divider
                            onClick={() => navigate("/settings/offline")}
                        >
                            <ListItemText primary="Offline Experience" />
                        </ListItemButton>
                        <ListItemButton
                            divider
                            onClick={() => navigate("/settings/compatibility")}
                        >
                            <ListItemText primary="Compatibility" />
                        </ListItemButton>
                    </Paper>
                    <Paper>
                        <Show when={storagePermission() === "prompt"}>
                            <ListItemButton
                                divider
                                onClick={() => requestPersistentStorage()}
                            >
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
                    <ListSubheader>About</ListSubheader>
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
