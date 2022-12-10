// Copyright 2022 The LightStands Web Contributors.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import {
    batch,
    Component,
    createEffect,
    createResource,
    createSignal,
    For,
    JSX,
    onCleanup,
    Show,
} from "solid-js";
import { useClient } from "../client";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";
import { aeither, getFeedInfo, PublicFeed } from "lightstands-js";
import { onMount } from "solid-js";
import { useLocation } from "@solidjs/router";
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
import Card from "@suid/material/Card";
import CardContent from "@suid/material/CardContent";
import Typography from "@suid/material/Typography";
import CardActions from "@suid/material/CardActions";
import Button from "@suid/material/Button";
import Style from "../common/Style.module.css";
import { settingStore } from "../stores/settings";
import { doSync, triggerSync } from "../common/synmgr";
import { useNavigate } from "../common/nav";
import {
    requestPersistentStorage,
    usePersistentStoragePermission,
} from "../common/storage";
import { useLiveQuery } from "../common/utils";
import { getDefaultFeedList, removeFeedFromList } from "../stores/feedlists";
import {
    AppBar,
    IconButton,
    ListItemIcon,
    ListSubheader,
    Popover,
    Toolbar,
} from "@suid/material";

import { Delete as DeleteIcon, Close as CloseIcon } from "@suid/icons-material";
import { useScaffold } from "../common/Scaffold";
import ToolbarTitle from "../common/ToolbarTitle";
import ToolbarIcon from "../common/ToolbarIcon";
import AdvMenu from "../common/AdvMenu";

const DefaultFeedListPage: Component = () => {
    triggerSync(["feedlists", "tags"]);
    const client = useClient();
    const session = useStore(currentSessionStore);
    const navigate = useNavigate();
    const storagePermission = usePersistentStoragePermission();
    const settings = useStore(settingStore);
    const loc = useLocation();
    const scaffoldCx = useScaffold();
    const [showAddFeed, setShowAddFeed] = createSignal(false);
    const [selectedItems, setSelectedItems] = createSignal<
        PublicFeed[] | undefined
    >(undefined, {
        equals: (v0, v1) => {
            if (typeof v0 === "undefined" || typeof v1 === "undefined") {
                return v0 === v1;
            }
            if (v0.length === v1.length) {
                for (let i = 0; i < v0.length; i++) {
                    if (v0[i] !== v1[i]) {
                        return false;
                    }
                }
                return true;
            } else {
                return false;
            }
        },
    });
    const [menuExpandedIconNumber, setMenuExpandedIconNumber] = createSignal(0);
    const listDetail = useLiveQuery(async () => {
        return await getDefaultFeedList();
    });
    const feedList = () => {
        const detail = listDetail();
        if (detail) {
            const result = [...detail.includes].filter(
                ([_feed, id]) => !detail.excludes.includes(id)
            );
            return result;
        } else {
            return [];
        }
    };

    const [listItemDetails] = createResource(feedList, async (listItems) => {
        const result = [];
        for (const [feedHash] of listItems) {
            const itemDetail = await aeither(
                {
                    left(l) {
                        return null;
                    },
                    right(r) {
                        return r;
                    },
                },
                getFeedInfo(client, feedHash)
            );
            result.push(itemDetail.value);
        }
        return result;
    });

    // false: closed
    // null: no target
    // PublicFeed: target
    const [menuTarget, setMenuTarget] = createSignal<false | null | PublicFeed>(
        false
    );
    const [menuPosition, setMenuPosition] = createSignal<{
        top: number;
        left: number;
    }>();

    onMount(() => {
        if (!session()) {
            navigate(`/sign-in?back=${encodeURIComponent(loc.pathname)}`);
        } else {
            if (settings().lastTimeSync === 0) {
                // Sync data when first-time sign in
                doSync(client, session()!.session);
            }
        }
    });

    const setStoragePermission = async () => {
        await requestPersistentStorage();
    };

    const onItemMouseDown = (feed: PublicFeed | null, ev: MouseEvent) => {
        if (ev.button === 2 && menuTarget() === false) {
            ev.preventDefault();
            ev.stopPropagation();
            batch(() => {
                setMenuPosition({ top: ev.pageY, left: ev.pageX });
                setMenuTarget(feed);
            });
        }
    };

    const onBodyContextMenu = (ev: MouseEvent) => {
        const menuTargetObject = menuTarget();
        if (menuTargetObject !== false && menuTargetObject !== null) {
            ev.preventDefault();
            return false;
        } else if (menuTargetObject === false) {
            ev.preventDefault();
            batch(() => {
                setMenuTarget(null);
                setMenuPosition({ top: ev.pageY, left: ev.pageX });
            });
            return false;
        }
    };

    createEffect(() => {
        if (!showAddFeed()) {
            document.addEventListener("contextmenu", onBodyContextMenu);
        } else {
            document.removeEventListener("contextmenu", onBodyContextMenu);
        }
    });

    onCleanup(() => {
        document.removeEventListener("contextmenu", onBodyContextMenu);
    });

    const onRemoveFeed = async (feed: PublicFeed) => {
        const [hash, euid] = feedList().filter(
            ([hash]) => hash === feed.urlBlake3
        )[0];
        await removeFeedFromList(
            client,
            session()!.session,
            listDetail()!.listid,
            euid
        );
        setMenuTarget(false);
    };

    const isItemSelectionMode = () => typeof selectedItems() !== "undefined";

    const enterItemSelectionMode = () => {
        if (!isItemSelectionMode()) {
            setSelectedItems([]);
        }
    };

    const exitItemSelectionMode = () => {
        return setSelectedItems(undefined);
    };

    const addSelectedItem = (feed: PublicFeed) => {
        setSelectedItems((old) =>
            typeof old !== "undefined" ? [...old, feed] : [feed]
        );
        setMenuTarget(false);
    };

    const rmSelectedItem = (feed: PublicFeed) => {
        setSelectedItems((old) =>
            typeof old !== "undefined" ? old.filter((v) => v !== feed) : old
        );
        setMenuTarget(false);
    };

    const isItemSelected = (feed: PublicFeed) => {
        return selectedItems()?.includes(feed);
    };

    const toggleItemSelected = (feed: PublicFeed) => {
        if (!isItemSelected(feed)) {
            addSelectedItem(feed);
        } else {
            rmSelectedItem(feed);
        }
    };

    const onItemClick = (feed: PublicFeed) => {
        if (isItemSelectionMode()) {
            toggleItemSelected(feed);
        } else {
            navigate(`/feeds/${feed.urlBlake3}`);
        }
    };

    const onRemoveSelectedFeeds = async () => {
        const feeds = selectedItems() || [];
        exitItemSelectionMode();
        for (const feed of feeds) {
            await onRemoveFeed(feed);
        }
    };

    const selectedBarIconNumber = () => {
        const itemNumber = selectedItems()?.length || 0;
        if (itemNumber > 0) {
            return 1;
        }
        return 0;
    };

    const selectedBarMenuExpanded = () => {
        const n = menuExpandedIconNumber();
        const result: JSX.Element[] = [];
        const itemNumber = selectedItems()?.length || 0;
        if (n > 0 && itemNumber > 0) {
            result.push(
                <IconButton
                    size="large"
                    color="inherit"
                    onClick={onRemoveSelectedFeeds}
                >
                    <DeleteIcon />
                </IconButton>
            );
        }
        return result;
    };

    const selectedBarMenuHidden = () => {
        const n = menuExpandedIconNumber();
        const result: JSX.Element[] = [];
        const itemNumber = selectedItems()?.length || 0;
        if (n < 1 && itemNumber > 0) {
            result.push(
                <ListItemButton onClick={onRemoveSelectedFeeds}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={`Delete ${itemNumber} ${
                            itemNumber > 1 ? "items" : "item"
                        }`}
                    />
                </ListItemButton>
            );
        }
        return result;
    };

    return (
        <>
            <BottomSheet
                open={showAddFeed()}
                onClose={() => setShowAddFeed((prev) => !prev)}
            >
                <AddFeedDlg
                    listId={listDetail()!.listid}
                    onClose={() => setShowAddFeed((prev) => !prev)}
                />
            </BottomSheet>
            <Popover
                open={menuTarget() !== false}
                anchorReference="anchorPosition"
                anchorPosition={menuPosition()}
                onClose={() => setMenuTarget(false)}
            >
                <List disablePadding sx={{ minWidth: "160px" }} dense>
                    <Show when={menuTarget() !== null}>
                        <ListSubheader>
                            {(menuTarget() as PublicFeed).title || "Feed"}
                        </ListSubheader>
                        <ListItemButton
                            onClick={[
                                toggleItemSelected,
                                menuTarget() as PublicFeed,
                            ]}
                        >
                            {isItemSelected(menuTarget() as PublicFeed) ? (
                                <>
                                    <ListItemText primary="Unselect" />
                                </>
                            ) : (
                                <>
                                    <ListItemText primary="Select" />
                                </>
                            )}
                        </ListItemButton>
                        <ListItemButton
                            divider
                            onClick={[onRemoveFeed, menuTarget() as PublicFeed]}
                        >
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary="Delete" />
                        </ListItemButton>
                    </Show>
                    <ListItemButton
                        onClick={() => {
                            setShowAddFeed(true);
                            setMenuTarget(false);
                        }}
                    >
                        <ListItemText primary="Add a feed" />
                    </ListItemButton>
                </List>
            </Popover>
            <Box
                sx={{
                    position: "absolute",
                    width: "fit-content",
                    right: "40px",
                    bottom: "50px",
                    transition: "transform 220ms ease-in-out",
                    transform: isItemSelectionMode()
                        ? "translateX(100%) translateX(40px)"
                        : undefined,
                    zIndex: 1,
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
            <Show
                when={isItemSelectionMode()}
                fallback={
                    <SharedAppBar
                        position="sticky"
                        title="Subscribed"
                        forceLeftIcon="drawer"
                        hide={scaffoldCx.state.scrollingDown}
                    >
                        <AdvMenu
                            totalIconNumber={1}
                            suggestWidth={
                                scaffoldCx.state.suggestExpandableMenuWidth
                            }
                            onExpandedIconNumberChanged={
                                setMenuExpandedIconNumber
                            }
                            expanded={[]}
                            hidden={[
                                <ListItemButton
                                    onClick={enterItemSelectionMode}
                                >
                                    <ListItemText primary="Select..." />
                                </ListItemButton>,
                            ]}
                        />
                    </SharedAppBar>
                }
            >
                <AppBar position="sticky" color="default">
                    <Toolbar>
                        <ToolbarIcon onClick={exitItemSelectionMode}>
                            <CloseIcon />
                        </ToolbarIcon>
                        <ToolbarTitle
                            primary={`${
                                selectedItems()?.length?.toString() || "0"
                            } selected`}
                            color="primary"
                        />
                        <AdvMenu
                            suggestWidth={
                                scaffoldCx.state.suggestExpandableMenuWidth
                            }
                            totalIconNumber={selectedBarIconNumber()}
                            onExpandedIconNumberChanged={
                                setMenuExpandedIconNumber
                            }
                            expanded={selectedBarMenuExpanded()}
                            hidden={selectedBarMenuHidden()}
                        />
                    </Toolbar>
                </AppBar>
            </Show>

            <Box>
                <Show
                    when={
                        storagePermission() === "prompt" &&
                        !settings().ignorePermissionTip
                    }
                >
                    <Card
                        class={Style.FixedCenterX}
                        sx={{ maxWidth: "560px", marginTop: "16px" }}
                    >
                        <CardContent>
                            <Typography>
                                The browser may wipe up our storage on your
                                device.
                            </Typography>
                            <Typography>
                                We need your permission to store data on your
                                device. The data is only for your experience, we
                                won't use the data to track you without your
                                attention.
                            </Typography>
                            <Typography>
                                You may find the option in "Settings" later.
                            </Typography>
                        </CardContent>
                        <CardActions class={Style.ButtonGroupEndAligned}>
                            <Button onClick={setStoragePermission}>Ok</Button>
                            <Button
                                onClick={() =>
                                    settingStore.setKey(
                                        "ignorePermissionTip",
                                        true
                                    )
                                }
                            >
                                Ignore
                            </Button>
                        </CardActions>
                    </Card>
                </Show>
                <List>
                    <For each={listItemDetails()}>
                        {(item, index) => {
                            if (item) {
                                return (
                                    <ListItemButton
                                        data-index={index()}
                                        divider
                                        selected={selectedItems()?.includes(
                                            item
                                        )}
                                        onClick={[onItemClick, item]}
                                        onMouseDown={(ev) =>
                                            onItemMouseDown(item, ev)
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
