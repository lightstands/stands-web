// Copyright 2022 The LightStands Web Contributors.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { Component, createResource, createSignal, For } from "solid-js";
import { useClient } from "../client";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";
import {
    aeither,
    aunwrap,
    getAllFeedLists,
    getFeedInfo,
    getFeedList,
} from "lightstands-js";
import { onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import Box from "@suid/material/Box";
import { Add as AddIcon } from "@suid/icons-material";
import Fab from "@suid/material/Fab";
import BottomSheet from "../common/BottomSheet";
import AddFeedDlg from "./AddFeedDlg";
import List from "@suid/material/List";
import ListItem from "@suid/material/ListItem";
import ListItemText from "@suid/material/ListItemText";
import ListItemButton from "@suid/material/ListItemButton";
import SharedAppBar from "../common/SharedAppBar";

const DefaultFeedListPage: Component = () => {
    const client = useClient();
    const session = useStore(currentSessionStore);
    const navigate = useNavigate();
    const loc = useLocation();
    const [showAddFeed, setShowAddFeed] = createSignal(false);
    const [defaultListMeta] = createResource(session, async (session) => {
        const lists = await aunwrap(getAllFeedLists(client, session.session));
        for (const l of lists) {
            if (l.tags.includes("_default")) {
                return l;
            }
        }
    });
    const [listDetail] = createResource(defaultListMeta, (listMeta) => {
        return aunwrap(getFeedList(client, session()!.session, listMeta.id));
    });
    const feedList = () => {
        const detail = listDetail();
        if (detail) {
            const result = [...detail.in].filter(
                (value) => !detail.rm.includes(value.euid)
            );
            return result;
        } else {
            return [];
        }
    };
    const [listItemDetails] = createResource(feedList, async (listItems) => {
        const result = [];
        for (const item of listItems) {
            const itemDetail = await aeither(
                {
                    left(l) {
                        return null;
                    },
                    right(r) {
                        return r;
                    },
                },
                getFeedInfo(client, item.feedUrlHash)
            );
            result.push(itemDetail.value);
        }
        return result;
    });
    onMount(() => {
        if (!session()) {
            navigate(`/sign-in?back=${encodeURIComponent(loc.pathname)}`);
        }
    });
    return (
        <>
            <BottomSheet
                open={showAddFeed()}
                onClose={() => setShowAddFeed((prev) => !prev)}
            >
                <AddFeedDlg
                    listId={listDetail()!.id}
                    onClose={() => setShowAddFeed((prev) => !prev)}
                />
            </BottomSheet>
            <Box
                sx={{
                    position: "absolute",
                    width: "fit-content",
                    right: "40px",
                    bottom: "50px",
                }}
            >
                <Fab
                    color="primary"
                    aria-label="add"
                    onClick={() => setShowAddFeed(true)}
                    disabled={!listDetail()}
                >
                    <AddIcon />
                </Fab>
            </Box>
            <SharedAppBar title="Subscribed" />
            <Box>
                <List>
                    <For each={listItemDetails()}>
                        {(item, index) => {
                            if (item) {
                                return (
                                    <ListItemButton
                                        data-index={index()}
                                        divider
                                        onClick={() =>
                                            navigate(
                                                `/feeds/${item.urlBlake3}/`
                                            )
                                        }
                                    >
                                        <ListItemText primary={item.title} />
                                    </ListItemButton>
                                );
                            } else {
                                return (
                                    <ListItem
                                        data-index={index()}
                                        divider
                                    ></ListItem>
                                );
                            }
                        }}
                    </For>
                </List>
            </Box>
        </>
    );
};

export default DefaultFeedListPage;
