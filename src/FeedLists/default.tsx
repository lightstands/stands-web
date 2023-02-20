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
import { useStore } from "@nanostores/solid";
import { aeither, PublicFeed } from "lightstands-js";
import {
    Fab,
    Box,
    List,
    ListItemText,
    ListItemButton,
    ListItem,
} from "@suid/material";
import {
    AppBar,
    IconButton,
    ListItemIcon,
    ListSubheader,
    Popover,
    Toolbar,
} from "@suid/material";

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from "@suid/icons-material";

import { getFeedInfo } from "../stores/feedmeta";
import { useScaffold } from "../common/Scaffold";
import ToolbarTitle from "../common/ToolbarTitle";
import ToolbarIcon from "../common/ToolbarIcon";
import AdvMenu, { getExpandableIconNumber } from "../common/AdvMenu";
import guardSignIn from "../common/guardSignIn";
import SharedAppBar from "../common/SharedAppBar";
import { settingStore } from "../stores/settings";
import { useSync } from "../common/synmgr";
import { useNavigate } from "../common/nav";
import { useLiveQuery } from "../common/utils";
import { getDefaultFeedList, removeFeedFromList } from "../stores/feedlists";
import { currentSessionStore } from "../stores/session";
import { useClient } from "../client";
import BottomSheet from "../common/BottomSheet";
import AddFeedDlg from "./AddFeedDlg";

import "../common/patchs/mui-list.css";
import { useI18n } from "../platform/i18n";

const DefaultFeedListPage: Component = () => {
    useSync();
    guardSignIn();
    const client = useClient();
    const session = useStore(currentSessionStore);
    const navigate = useNavigate();
    const scaffoldCx = useScaffold();
    const [t] = useI18n();
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
        if (
            !(
                showAddFeed() ||
                (scaffoldCx.state.drawerType === "temporary" &&
                    scaffoldCx.state.drawerOpen)
            )
        ) {
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
        batch(() => {
            setSelectedItems((old) =>
                typeof old !== "undefined" ? old.filter((v) => v !== feed) : old
            );
            setMenuTarget(false);
            if ((selectedItems()?.length || 0) === 0) {
                exitItemSelectionMode();
            }
        });
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

    const selectedMenuExpandedIconNumber = () => {
        const width = scaffoldCx.state.suggestExpandableMenuWidth;
        if (width) {
            return getExpandableIconNumber(width, 1);
        } else {
            return 0;
        }
    };

    const selectedBarMenuExpanded = () => {
        const n = selectedMenuExpandedIconNumber();
        const result: JSX.Element[] = [];
        const itemNumber = selectedItems()?.length || 0;
        if (n > 0 && itemNumber > 0) {
            result.push(
                <IconButton
                    size="large"
                    color="inherit"
                    onClick={onRemoveSelectedFeeds}
                    aria-label={
                        itemNumber > 1
                            ? t("deleteMultiples", { n: itemNumber.toString() })
                            : t("deleteOneOrNone", { n: itemNumber.toString() })
                    }
                >
                    <DeleteIcon />
                </IconButton>
            );
        }
        return result;
    };

    const selectedBarMenuHidden = () => {
        const n = selectedMenuExpandedIconNumber();
        const result: JSX.Element[] = [];
        const itemNumber = selectedItems()?.length || 0;
        if (n < 1 && itemNumber > 0) {
            result.push(
                <ListItemButton onClick={onRemoveSelectedFeeds}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            itemNumber > 1
                                ? t("deleteMultiples", {
                                      n: itemNumber.toString(),
                                  })
                                : t("deleteOneOrNone", {
                                      n: itemNumber.toString(),
                                  })
                        }
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
                            {(menuTarget() as PublicFeed).title || t("feed")}
                        </ListSubheader>
                        <ListItemButton
                            onClick={[
                                toggleItemSelected,
                                menuTarget() as PublicFeed,
                            ]}
                        >
                            {isItemSelected(menuTarget() as PublicFeed) ? (
                                <>
                                    <ListItemText primary={t("unselect")} />
                                </>
                            ) : (
                                <>
                                    <ListItemText primary={t("select")} />
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
                            <ListItemText primary={t("deleteText")} />
                        </ListItemButton>
                    </Show>
                    <ListItemButton
                        onClick={() => {
                            setShowAddFeed(true);
                            setMenuTarget(false);
                        }}
                    >
                        <ListItemText primary={t("addFeedAction")} />
                    </ListItemButton>
                </List>
            </Popover>

            <Show
                when={isItemSelectionMode()}
                fallback={
                    <SharedAppBar
                        position="sticky"
                        title={t("listNameSubscribed")}
                        forceLeftIcon="drawer"
                        hide={scaffoldCx.state.scrollingDown}
                    >
                        <AdvMenu
                            expanded={[]}
                            hidden={[
                                <ListItemButton
                                    onClick={enterItemSelectionMode}
                                >
                                    <ListItemText primary={t("selectStart")} />
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
                            primary={t("selectedTitle", {
                                n: selectedItems()?.length?.toString() || "0",
                            })}
                            color="primary"
                        />
                        <AdvMenu
                            expanded={selectedBarMenuExpanded()}
                            hidden={selectedBarMenuHidden()}
                        />
                    </Toolbar>
                </AppBar>
            </Show>

            <Box>
                <main>
                    <List aria-label={t("feedListQuickExpl")}>
                        <For each={listItemDetails()}>
                            {(item, index) => {
                                if (item) {
                                    return (
                                        <ListItemButton
                                            data-index={index()}
                                            tabIndex={0}
                                            divider
                                            selected={selectedItems()?.includes(
                                                item
                                            )}
                                            onClick={[onItemClick, item]}
                                            onMouseDown={(ev) =>
                                                onItemMouseDown(item, ev)
                                            }
                                        >
                                            <ListItemText
                                                primary={item.title}
                                            />
                                        </ListItemButton>
                                    );
                                } else {
                                    return (
                                        <ListItem
                                            data-index={index()}
                                            divider
                                            tabIndex={0}
                                        ></ListItem>
                                    );
                                }
                            }}
                        </For>
                    </List>
                    <Box
                        sx={{
                            position: "absolute",
                            width: "fit-content",
                            right: "40px",
                            bottom: "50px",
                            transition: "transform 220ms ease-in-out",
                            transform: isItemSelectionMode()
                                ? "translateX(100%) translateX(58px) rotate(360deg)"
                                : undefined,
                            zIndex: 1,
                        }}
                    >
                        <Fab
                            color="primary"
                            aria-label={t("addFeedAction")}
                            onClick={() => setShowAddFeed(true)}
                            disabled={!listDetail()}
                            tabIndex={0}
                        >
                            <AddIcon />
                        </Fab>
                    </Box>
                </main>
            </Box>
        </>
    );
};

export default DefaultFeedListPage;
