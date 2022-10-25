import { useLocation, useNavigate } from "@solidjs/router";
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

const FEED_POST_REGEXP = /\/feeds\/(.*?)\/posts\/(.+)\/?$/;
const FEED_REGEXP = /\/feeds\/([^\/]*?)\/?(?!.+)$/;

const NviDrawerList: Component = () => {
    const loc = useLocation();
    const client = useClient();
    const navigate = useNavigate();
    const pathname = () => loc.pathname;
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
                <ListItemButton
                    selected={pathname() === "/feedlists/default"}
                    onClick={() => navigate("/feedlists/default")}
                >
                    <ListItemIcon>
                        <ListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Subscribed" />
                </ListItemButton>

                <Show when={feedPostConfig()}>
                    <ListItemButton selected={!!feedPostConfig()?.feed}>
                        <ListItemIcon>
                            <ListIcon />
                        </ListItemIcon>
                        <ListItemText primary={"Feeds"} />
                    </ListItemButton>
                    <List disablePadding>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={!!feedPostConfig()?.feed}
                        >
                            <ListItemText
                                inset
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
                <ListItemButton
                    selected={pathname().startsWith("/settings")}
                    onClick={() => navigate("/settings")}
                >
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                </ListItemButton>
            </List>
        </>
    );
};

export default NviDrawerList;
