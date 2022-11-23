import { useLocation } from "@solidjs/router";
import List from "@suid/material/List";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemIcon from "@suid/material/ListItemIcon";
import { Component, createResource, Show } from "solid-js";
import {
    List as ListIcon,
    Settings as SettingsIcon,
} from "@suid/icons-material";
import ListItemText from "@suid/material/ListItemText";
import { aunwrap, getFeedInfo, PublicFeed } from "lightstands-js";
import { useClient } from "../client";
import Divider from "@suid/material/Divider";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";
import { useNavigate } from "./nav";

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
                        selected={pathname() === "/feedlists/default"}
                        onClick={() => {
                            navigate("/feedlists/default");
                            props.afterItemClicked({});
                        }}
                    >
                        <ListItemIcon>
                            <ListIcon />
                        </ListItemIcon>
                        <ListItemText primary="Subscribed" />
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
                                <ListItemText primary="Sign in" />
                            </ListItemButton>
                            <ListItemButton
                                onClick={() => {
                                    navigate("/sign-up/");
                                    props.afterItemClicked({});
                                }}
                            >
                                <ListItemText primary="Create account" />
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
                        <ListItemText primary="Settings" />
                    </ListItemButton>
                </Show>
            </List>
        </>
    );
};

export default NviDrawerList;
