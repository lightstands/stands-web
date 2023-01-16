import { Component, createResource, createSignal, Show } from "solid-js";
import {
    Paper,
    Toolbar,
    Typography,
    IconButton,
    ListItemText,
    ListItemButton,
    Box,
} from "@suid/material";
import { aunwrap, fetchContent, getPost } from "lightstands-js";
import { useStore } from "@nanostores/solid";

import {
    Close as CloseIcon,
    DoneAll as DoneAllIcon,
    RemoveDone as RemoveDoneIcon,
    Share as ShareIcon,
} from "@suid/icons-material";

import { useClient } from "../client";
import SafeDocView from "./SafeDocView";
import { useScaffold } from "../common/Scaffold";
import Delayed from "./Delayed";
import Style from "../common/Style.module.css";
import { isPostTagged, tagPostAndSync, untagPostAndSync } from "../stores/tags";
import { currentSessionStore } from "../stores/session";
import AdvMenu, { getExpandableIconNumber } from "../common/AdvMenu";
import AltShare, { AltSharingObject } from "./AltShare";
import { useAppSettings } from "../stores/settings";
import { useI18n } from "../platform/i18n";
import { openExternalUrl } from "../platform/open-url";
import useScrollDownDetector from "../common/useScrollDownDetector";

import "./PostInner.css";

interface PostInnerProps {
    feedUrlBlake3: string;
    postIdBlake3: string;
}

const PostInner: Component<PostInnerProps> = (props) => {
    const appSettings = useAppSettings();
    const client = useClient();
    const session = useStore(currentSessionStore);
    const scaffoldCx = useScaffold();
    const [webViewHeight, setWebViewHeight] = createSignal<number | string>(
        scaffoldCx.state.height || "100vh"
    );
    const [postMetadata] = createResource(
        () => [props.feedUrlBlake3, props.postIdBlake3],
        ([feedUrlBlake3, postIdBlake3]) => {
            return aunwrap(getPost(client, feedUrlBlake3, postIdBlake3));
        }
    );
    const [content] = createResource(
        () => [props.feedUrlBlake3, props.postIdBlake3],
        async ([feedUrlBlake3, postIdBlake3]) => {
            const response: Response = await aunwrap(
                fetchContent(client, feedUrlBlake3, postIdBlake3, {
                    contentType: "text/html",
                })
            );
            return await response.text();
        }
    );
    const [{ scrolling, scrolled }, handleContainerScroll] =
        useScrollDownDetector();
    const isPermanentDrawerOpen = () =>
        scaffoldCx.state.drawerOpen &&
        scaffoldCx.state.drawerType == "permanent";
    const [isPostRead, isPostReadCtl] = createResource(
        () => [postMetadata()],
        async ([postMeta]) => {
            if (postMeta) {
                return await isPostTagged(postMeta.ref, "_read");
            } else {
                return undefined;
            }
        }
    );

    const [alterSharingObject, setAlterSharingObject] =
        createSignal<AltSharingObject>();

    const [t] = useI18n();

    const markAsRead = async () => {
        const currentSession = session();
        const postMeta = postMetadata();
        if (currentSession && postMeta) {
            await tagPostAndSync(
                client,
                currentSession.session,
                currentSession.session.accessTokenObject.userid,
                "_read",
                postMeta.ref,
                props.feedUrlBlake3,
                props.postIdBlake3
            );
        }
        isPostReadCtl.refetch();
    };

    const markAsUnread = async () => {
        const currentSession = session();
        const postMeta = postMetadata();
        if (currentSession && postMeta) {
            await untagPostAndSync(
                client,
                currentSession.session,
                currentSession.session.accessTokenObject.userid,
                "_read",
                postMeta.ref,
                props.feedUrlBlake3,
                props.postIdBlake3
            );
        }
        isPostReadCtl.refetch();
    };

    const sharePostLink = async () => {
        const postMeta = postMetadata();
        if (postMeta) {
            if (postMeta.link) {
                if (
                    appSettings().systemSharing === "auto" &&
                    typeof navigator.share !== "undefined"
                ) {
                    await navigator.share({
                        title: postMeta.title,
                        url: postMeta.link,
                    });
                } else {
                    setAlterSharingObject({
                        title: postMeta.title,
                        url: postMeta.link,
                    });
                }
            }
        }
    };

    const canSharePostLink = () => {
        const postMeta = postMetadata();
        if (postMeta?.link) {
            if (appSettings().systemSharing === "auto") {
                if (typeof navigator.canShare !== "undefined") {
                    return navigator.canShare({
                        title: postMeta.title,
                        url: postMeta.link,
                    });
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }
        return false;
    };

    const expandedMenuIconNumber = () => {
        return getExpandableIconNumber(
            scaffoldCx.state.suggestExpandableMenuWidth,
            2
        );
    };

    const expandedMenuItems = () => {
        const n = expandedMenuIconNumber();
        const items = [];
        if (n - items.length > 0 && session()) {
            items.push(
                isPostRead() ? (
                    <IconButton
                        size="large"
                        color="inherit"
                        class="tooltip"
                        aria-description={t("markUnreadAction")}
                        onClick={markAsUnread}
                        disabled={!postMetadata()}
                    >
                        <RemoveDoneIcon />
                    </IconButton>
                ) : (
                    <IconButton
                        size="large"
                        color="inherit"
                        class="tooltip"
                        aria-description={t("markReadAction")}
                        onClick={markAsRead}
                        disabled={!postMetadata()}
                    >
                        <DoneAllIcon />
                    </IconButton>
                )
            );
        }
        if (n - items.length > 0) {
            items.push(
                <IconButton
                    size="large"
                    color="inherit"
                    class="tooltip"
                    aria-description={t("shareAction")}
                    disabled={!canSharePostLink()}
                    onClick={sharePostLink}
                >
                    <ShareIcon />
                </IconButton>
            );
        }
        return items;
    };

    const hiddenMenuItems = () => {
        const n = expandedMenuIconNumber();

        const items = [
            <ListItemButton
                disabled={postMetadata.loading || !postMetadata()?.link}
                onClick={() => openExternalUrl(postMetadata()!.link!)}
            >
                <ListItemText primary={t("openLinkAction")} />
            </ListItemButton>,
        ];
        if (n - items.length < 0) {
            items.unshift(
                <ListItemButton
                    disabled={!canSharePostLink()}
                    onClick={sharePostLink}
                >
                    <ListItemText primary={t("shareAction")} />
                </ListItemButton>
            );
        }
        if (n - items.length < 0 && session()) {
            items.unshift(
                isPostRead() ? (
                    <ListItemButton
                        disabled={!postMetadata()}
                        onClick={markAsUnread}
                    >
                        <ListItemText primary={t("markUnreadAction")} />
                    </ListItemButton>
                ) : (
                    <ListItemButton
                        disabled={!postMetadata()}
                        onClick={markAsRead}
                    >
                        <ListItemText primary={t("markReadAction")} />
                    </ListItemButton>
                )
            );
        }
        return items;
    };
    return (
        <>
            <Paper
                sx={{
                    display: "flex",
                    height: "100%",
                    flexDirection: "column",
                    borderRadius: "1px",
                }}
            >
                <AltShare
                    sharing={alterSharingObject()}
                    onClose={() => setAlterSharingObject()}
                />

                <Box
                    sx={{ overflow: "auto", overscrollBehavior: "contain" }}
                    onScroll={handleContainerScroll}
                >
                    <Toolbar
                        role="toolbar"
                        aria-hidden={scrolling() ? "true" : "false"}
                        sx={{
                            position: "sticky",
                            backgroundColor: "background.paper",
                        }}
                        class={`PostInnerToolbar${
                            scrolled() ? " scrolled" : ""
                        }${scrolling() ? " scrolling" : ""}`}
                    >
                        <Box class={Style.FlexboxRow} sx={{ flexGrow: 1 }}>
                            <IconButton
                                size="large"
                                color="inherit"
                                onClick={() => {
                                    window.history.go(-1);
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Box
                            class={Style.FlexboxRow}
                            sx={{ justifyContent: "end" }}
                        >
                            <AdvMenu
                                hidden={hiddenMenuItems()}
                                expanded={expandedMenuItems()}
                            />
                        </Box>
                    </Toolbar>
                    <article>
                        <Typography
                            component="h5"
                            variant="h5"
                            sx={{
                                marginX: "36px",
                                paddingBottom: "24px",
                            }}
                        >
                            {postMetadata()?.title}
                        </Typography>
                        <Show
                            when={content.state === "ready"}
                            fallback={
                                <Delayed timeout={1000}>
                                    <Typography
                                        sx={{
                                            width: "100%",
                                            textAlign: "center",
                                        }}
                                    >
                                        {t("contentInProgress")}
                                    </Typography>
                                </Delayed>
                            }
                        >
                            <SafeDocView
                                width="100%"
                                height={webViewHeight()}
                                srcdoc={content()}
                                title={postMetadata()?.title}
                                onDocumentResize={({ height }) => {
                                    setWebViewHeight(height);
                                }}
                            />
                        </Show>
                    </article>
                </Box>
            </Paper>
        </>
    );
};

export default PostInner;
