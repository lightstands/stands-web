import { useLocation } from "@solidjs/router";
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@suid/material";
import { Component, createResource, Show } from "solid-js";
import { aunwrap, getFeedInfo, PublicFeed } from "lightstands-js";
import { useStore } from "@nanostores/solid";

import {
    List as ListIcon,
    Settings as SettingsIcon,
    Timeline as TimelineIcon,
} from "@suid/icons-material";

import { useClient } from "../client";
import { currentSessionStore } from "../stores/session";
import { useNavigate } from "./nav";
import { useI18n } from "../platform/i18n";

const FEED_POST_REGEXP = /\/feeds\/(.*?)\/posts\/(.+)\/?$/;
const FEED_REGEXP = /\/feeds\/([^\/]*?)\/?(?!.+)$/;

interface NviDrawerListProps {
    afterItemClicked: (ev: {}) => void;
}

const NviDrawerList: Component<NviDrawerListProps> = (props) => {
    const loc = useLocation();
    const client = useClient();
    const navigate = useNavigate();
    const pathname = () => loc.pathname;
    const currentSession = useStore(currentSessionStore);
    const [t] = useI18n();
    const feedPostConfig = () => {
        const name = pathname();
        if (!name.startsWith("/feeds/")) {
            return undefined;
        }
        const match0 = FEED_POST_REGEXP.exec(name);
        if (match0) {
            return {
                feed: match0[1],
                post: match0[2],
            };
        } else {
            const match1 = FEED_REGEXP.exec(name);
            if (match1) {
                return {
                    feed: match1[1],
                };
            } else {
                return undefined;
            }
        }
    };
    const [feedMetadata] = createResource(
        feedPostConfig,
        (conf): Promise<PublicFeed | undefined> => {
            if (conf) {
                return aunwrap(getFeedInfo(client, conf.feed));
            } else {
                return Promise.resolve(undefined);
            }
        }
    );
    return (
        <>
            <List sx={{ width: "100%", height: "100%" }} disablePadding>
                <Show when={!!currentSession()}>
                    <ListItemButton
                        selected={pathname() === "/"}
                        onClick={() => {
                            navigate("/");
                            props.afterItemClicked({});
                        }}
                    >
                        <ListItemIcon>
                            <TimelineIcon />
                        </ListItemIcon>
                        <ListItemText primary={t("timeline")} />
                    </ListItemButton>
                    <ListItemButton
                        selected={pathname() === "/feedlists/default"}
                        onClick={() => {
                            navigate("/feedlists/default");
                            props.afterItemClicked({});
                        }}
                    >
                        <ListItemIcon>
                            <ListIcon />
                        </ListItemIcon>
                        <ListItemText primary={t("listNameSubscribed")} />
                    </ListItemButton>
                </Show>

                <Show when={feedPostConfig()}>
                    <List disablePadding>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={!!feedPostConfig()?.feed}
                        >
                            <ListItemText
                                inset={!!currentSession()}
                                primaryTypographyProps={{
                                    noWrap: true,
                                    textOverflow: "ellipsis",
                                }}
                                primary={
                                    feedMetadata()
                                        ? feedMetadata()?.title || "..."
                                        : "..."
                                }
                            />
                        </ListItemButton>
                    </List>
                </Show>
            </List>
            <List disablePadding>
                <Divider />
                <Show
                    when={!!currentSession()}
                    fallback={
                        <>
                            <ListItemButton
                                onClick={() => {
                                    navigate(
                                        `/sign-in?back=${encodeURIComponent(
                                            pathname()
                                        )}`
                                    );
                                    props.afterItemClicked({});
                                }}
                            >
                                <ListItemText primary={t("signIn")} />
                            </ListItemButton>
                            <ListItemButton
                                onClick={() => {
                                    navigate("/sign-up/");
                                    props.afterItemClicked({});
                                }}
                            >
                                <ListItemText primary={t("createAccount")} />
                            </ListItemButton>
                        </>
                    }
                >
                    <ListItemButton
                        selected={pathname().startsWith("/settings")}
                        onClick={() => {
                            navigate("/settings");
                            props.afterItemClicked({});
                        }}
                    >
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary={t("settingsTitle")} />
                    </ListItemButton>
                </Show>
            </List>
        </>
    );
};

export default NviDrawerList;
