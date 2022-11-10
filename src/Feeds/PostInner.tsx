import Box from "@suid/material/Box";
import { Component, createResource, createSignal, Show } from "solid-js";
import Paper from "@suid/material/Paper";
import Toolbar from "@suid/material/Toolbar";
import Typography from "@suid/material/Typography";
import IconButton from "@suid/material/IconButton";
import { Close as CloseIcon } from "@suid/icons-material";
import { useClient } from "../client";
import { aunwrap, fetchContent, getPost } from "lightstands-js";
import SafeDocView from "./SafeDocView";
import { useScaffold } from "../common/Scaffold";
import Delayed from "./Delayed";

interface PostInnerProps {
    feedUrlBlake3: string;
    postIdBlake3: string;
}

const PostInner: Component<PostInnerProps> = (props) => {
    const client = useClient();
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
            const response = await aunwrap(
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
                  transition:
                      "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
              }
            : {
                  transition:
                      "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
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
                    ...toolbarShadowSx(),
                }}
            >
                <IconButton
                    size="large"
                    color="inherit"
                    onClick={() => {
                        window.history.go(-1);
                    }}
                >
                    <CloseIcon />
                </IconButton>
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
                                Waiting for post...
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
