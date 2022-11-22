import Box from "@suid/material/Box";
import { Component, createResource, createSignal, Show } from "solid-js";
import Paper from "@suid/material/Paper";
import Toolbar from "@suid/material/Toolbar";
import Typography from "@suid/material/Typography";
import IconButton from "@suid/material/IconButton";
import {
    Close as CloseIcon,
    DoneAll as DoneAllIcon,
    RemoveDone as RemoveDoneIcon,
} from "@suid/icons-material";
import { useClient } from "../client";
import { aunwrap, fetchContent, getPost } from "lightstands-js";
import SafeDocView from "./SafeDocView";
import { useScaffold } from "../common/Scaffold";
import Delayed from "./Delayed";
import Style from "../common/Style.module.css";
import { isPostTagged, tagPostAndSync, untagPostAndSync } from "../stores/tags";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";
import AdvMenu from "../common/AdvMenu";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemText from "@suid/material/ListItemText";

interface PostInnerProps {
    feedUrlBlake3: string;
    postIdBlake3: string;
}

const PostInner: Component<PostInnerProps> = (props) => {
    const client = useClient();
    const session = useStore(currentSessionStore);
    const scaffoldCx = useScaffold();
    const [expandedMenuIconNumber, setExpandedMenuIconNumber] = createSignal(0);
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
    const [scrolled, setScrolled] = createSignal(false);
    const isPermanentDrawerOpen = () =>
        scaffoldCx.state.drawerOpen &&
        scaffoldCx.state.drawerType == "permanent";
    const toolbarShadowSx = () =>
        scrolled()
            ? {
                  boxShadow:
                      "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)",
              }
            : {};
    // TODO: Sync the read status with local database
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

    const expandedMenuItems = () => {
        const n = expandedMenuIconNumber();
        if (n > 1 && session()) {
            return [
                isPostRead() ? (
                    <IconButton
                        size="large"
                        color="inherit"
                        class="tooltip"
                        aria-description="Mark as unread"
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
                        aria-description="Mark as read"
                        onClick={markAsRead}
                        disabled={!postMetadata()}
                    >
                        <DoneAllIcon />
                    </IconButton>
                ),
            ];
        } else {
            return [];
        }
    };

    const hiddenMenuItems = () => {
        const n = expandedMenuIconNumber();

        const items = [
            <ListItemButton>
                <ListItemText primary="Open link..." />
            </ListItemButton>,
        ];
        if (n < 1 && session()) {
            items.unshift(
                <ListItemButton>
                    <ListItemText primary="Mark as read" />
                </ListItemButton>
            );
        }
        return items;
    };
    return (
        <Paper
            sx={{
                display: "flex",
                position: "relative",
                left: isPermanentDrawerOpen() ? "240px" : undefined,
                maxWidth: isPermanentDrawerOpen()
                    ? "calc(100% - 240px)"
                    : "100%",
                height: "100%",
                flexDirection: "column",
                borderRadius: "1px",
            }}
        >
            <Toolbar
                sx={{
                    display: "flex",
                    transition:
                        "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                    ...toolbarShadowSx(),
                }}
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
                <Box class={Style.FlexboxRow} sx={{ justifyContent: "end" }}>
                    <AdvMenu
                        suggestWidth={
                            scaffoldCx.state.suggestExpandableMenuWidth ||
                            undefined
                        }
                        hidden={hiddenMenuItems()}
                        expanded={expandedMenuItems()}
                        totalIconNumber={2}
                        onExpandedIconNumberChanged={setExpandedMenuIconNumber}
                    />
                </Box>
            </Toolbar>
            <Box
                sx={{ overflow: "auto" }}
                onScroll={(ev) => setScrolled(ev.currentTarget.scrollTop !== 0)}
            >
                <Typography
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
                                sx={{ width: "100%", textAlign: "center" }}
                            >
                                Waiting for traffic...
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
            </Box>
        </Paper>
    );
};

export default PostInner;
