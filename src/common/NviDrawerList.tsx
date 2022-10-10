import { useLocation } from "@solidjs/router";
import List from "@suid/material/List";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemIcon from "@suid/material/ListItemIcon";
import { Component, createResource, Show } from "solid-js";
import { List as ListIcon } from "@suid/icons-material";
import ListItemText from "@suid/material/ListItemText";
import { aunwrap, getFeedInfo, PublicFeed } from "lightstands-js";
import { useClient } from "../client";

const FEED_POST_REGEXP = /\/feeds\/(.*?)\/posts\/(.+)\/?$/;
const FEED_REGEXP = /\/feeds\/([^\/]*?)\/?(?!.+)$/;

const NviDrawerList: Component = () => {
    const loc = useLocation();
    const client = useClient();
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
        <List sx={{ width: "100%", height: "100%" }} disablePadding>
            <ListItemButton selected={!!feedPostConfig()?.feed}>
                <ListItemIcon>
                    <ListIcon />
                </ListItemIcon>
                <ListItemText primary={"Feeds"} />
            </ListItemButton>
            <Show when={feedPostConfig()}>
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
    );
};

export default NviDrawerList;
