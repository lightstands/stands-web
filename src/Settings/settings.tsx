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
    createEffect,
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
import { useServiceWorker } from "../common/swbridge";
import { useScaffold } from "../common/Scaffold";
import guardSignIn from "../common/guardSignIn";
import {
    autoMatchLangTag,
    autoMatchRegion,
    SUPPORTED_LANGS,
    useDateFnLocale,
    useI18n,
} from "../platform/i18n";

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
    const dateFnLocale = useDateFnLocale();

    const pureNavigate = (to: string) => navigate(to);

    return (
        <>
            <SharedAppBar
                title={t("settingsTitle", undefined)}
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
                            <ListItemText primary={t("signOut", undefined)} />
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
                        <ListSubheader>
                            {t("upgragdeTipTitle", undefined)}
                        </ListSubheader>
                        <Paper>
                            <ListItemButton
                                onClick={() => updateServiceWorker()}
                            >
                                <ListItemText
                                    primary={t("upgradeTipConfirm", undefined)}
                                />
                            </ListItemButton>
                        </Paper>
                    </Show>
                    <ListSubheader>{t("acctTitle", undefined)}</ListSubheader>
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
                                        ? t("chEmailAddrButText", undefined)
                                        : t("setEmailButText", undefined)
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
                                primary={t("chUsernameButText", undefined)}
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
                                <ListItemText
                                    primary={t("setPassButText", undefined)}
                                />
                            </ListItemButton>
                        </Show>
                    </Paper>
                    <ListSubheader>{t("general", {})}</ListSubheader>
                    <Paper>
                        <ListItem divider>
                            <ListItemText primary={t("appLangTitle", {})} />
                            <ListItemSecondaryAction>
                                <select
                                    value={settings().appLang}
                                    onChange={(ev) => {
                                        const newValue = ev.currentTarget.value;
                                        setAppSetting("appRegion", "xauto");
                                        setAppSetting("appLang", newValue);
                                        if (newValue !== "xauto") {
                                            locale(newValue);
                                        } else {
                                            locale(autoMatchLangTag());
                                        }
                                    }}
                                >
                                    <option value="xauto">
                                        {t("langAuto", {
                                            langName: LANG_NAMES.get(
                                                autoMatchLangTag()
                                            )!,
                                        })}
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
                        <ListItem divider>
                            <ListItemText
                                primary={t("selectRegionText", undefined)}
                            />
                            <ListItemSecondaryAction>
                                <select
                                    value={settings().appRegion}
                                    onChange={(ev) => {
                                        setAppSetting(
                                            "appRegion",
                                            ev.currentTarget.value
                                        );
                                    }}
                                >
                                    <option value="xauto">
                                        {t("autoRegion", {
                                            regionName: (
                                                t(
                                                    "regions",
                                                    undefined
                                                ) as Record<string, string>
                                            )[autoMatchRegion(t)],
                                        })}
                                    </option>
                                    <For
                                        each={Object.entries(
                                            t("regions", undefined) as Record<
                                                string,
                                                string
                                            >
                                        )}
                                    >
                                        {([regionCode, name]) => (
                                            <option value={regionCode}>
                                                {name}
                                            </option>
                                        )}
                                    </For>
                                </select>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </Paper>
                    <ListSubheader>
                        {t("feeds", undefined, "Feeds")}
                    </ListSubheader>
                    <Paper>
                        <ListItem>
                            <ListItemText
                                primary={t("feedsDefaultFilter", undefined)}
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
                                    <option value={""}>
                                        {t("feedFilterUnset")}
                                    </option>
                                    <option value={"_read"}>
                                        {t("postTagRead")}
                                    </option>
                                    <option value={"!_read"}>
                                        {t("postTagUnread")}
                                    </option>
                                </select>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </Paper>
                    <ListSubheader>
                        {t("accessibility", undefined)}
                    </ListSubheader>
                    <Paper>
                        <ListItemButton
                            divider
                            onClick={[pureNavigate, "/settings/compatibility"]}
                        >
                            <ListItemText
                                primary={t(
                                    "compatOptsEntry",
                                    undefined,
                                    "Compatibility"
                                )}
                            />
                        </ListItemButton>
                    </Paper>
                    <Paper>
                        <ListItemButton
                            divider
                            onClick={[pureNavigate, "/settings/storage"]}
                        >
                            <ListItemText primary={t("storage", undefined)} />
                        </ListItemButton>
                    </Paper>
                    <ListSubheader>
                        {t("about", undefined, "About")}
                    </ListSubheader>
                    <Paper>
                        <ListItem divider>
                            <ListItemText
                                primary={
                                    import.meta.env.PROD
                                        ? "LightStands for Web"
                                        : "LightStands for Web (dev)"
                                }
                                secondary={t("versionDescription", {
                                    pakVer: import.meta.env.PACKAGE_VERSION,
                                    lastUpdTimeDt: formatDistanceToNow(
                                        new Date(import.meta.env.BUILD_AT),
                                        { locale: dateFnLocale() }
                                    ),
                                })}
                            />
                        </ListItem>
                        <ListItemButton
                            divider
                            component={"a"}
                            href="https://github.com/lightstands/stands-web/"
                            rel="noopener"
                        >
                            <ListItemText
                                primary={
                                    <Typography>
                                        {t("sourceCode", undefined)}
                                        <OpenInNewIcon fontSize="inherit" />
                                    </Typography>
                                }
                            />
                        </ListItemButton>
                        <ListItemButton
                            divider
                            component="a"
                            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
                            rel="noopener"
                        >
                            <ListItemText
                                primary={
                                    <Typography color="ButtonText">
                                        {t("freeSoftwareClaim", undefined)}
                                        <OpenInNewIcon fontSize="inherit" />
                                    </Typography>
                                }
                                secondary={t("licenseClaim", undefined)}
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
