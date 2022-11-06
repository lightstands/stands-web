import {
    Outlet,
    useNavigate,
    useParams,
    useSearchParams,
} from "@solidjs/router";
import {
    Component,
    createResource,
    createSignal,
    For,
    Match,
    onMount,
    Show,
    Switch,
} from "solid-js";
import { OpenInNew as OpenInNewIcon } from "@suid/icons-material";
import ToolbarTitle from "../common/ToolbarTitle";
import {
    aeither,
    aunwrap,
    getFeedInfo,
    getFeedPosts,
    PublicPost,
} from "lightstands-js";
import { useClient } from "../client";
import CircularProgress from "@suid/material/CircularProgress";
import Typography from "@suid/material/Typography";
import Box from "@suid/material/Box";
import Link from "@suid/material/Link";
import { formatDistance } from "date-fns";
import List from "@suid/material/List";
import Card from "@suid/material/Card";
import ListItem from "@suid/material/ListItem";
import Style from "./feed.module.css";
import ListItemText from "@suid/material/ListItemText";
import Divider from "@suid/material/Divider";
import LinearProgress from "@suid/material/LinearProgress";
import SharedAppBar from "../common/SharedAppBar";
import CommonStyle from "../common/Style.module.css";
import { createStore } from "solid-js/store";

function PostListItem(props: { metadata: PublicPost; feedUrlBlake3: string }) {
    const navigate = useNavigate();
    const hasContent = () => props.metadata.contentTypes.length > 0;
    const hasLink = () => typeof props.metadata.link !== "undefined";
    return (
        <Switch>
            <Match when={!hasContent() && hasLink()}>
                <ListItem
                    sx={{ cursor: "pointer" }}
                    data-index={props.metadata.ref}
                    onClick={() => {
                        if (
                            window.confirm(
                                `Open this link?\n\n${props.metadata.link}`
                            )
                        ) {
                            window.open(props.metadata.link, "_blank");
                        }
                    }}
                >
                    <ListItemText
                        primary={
                            <div class={Style["post-list-item-primary-title"]}>
                                <Typography>{props.metadata.title}</Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    ({new URL(props.metadata.link!).hostname})
                                    <OpenInNewIcon fontSize="inherit" />
                                </Typography>
                            </div>
                        }
                        secondary={props.metadata.summary}
                    />
                </ListItem>
            </Match>
            <Match when={hasContent()}>
                <ListItem
                    sx={{ cursor: "pointer" }}
                    data-index={props.metadata.ref}
                    onClick={() =>
                        navigate(
                            `/feeds/${props.feedUrlBlake3}/posts/${props.metadata.idBlake3}`
                        )
                    }
                >
                    <ListItemText
                        primary={props.metadata.title}
                        secondary={props.metadata.summary}
                    />
                </ListItem>
            </Match>
            <Match when={true}>
                <ListItem data-index={props.metadata.ref}>
                    <ListItemText
                        primary={props.metadata.title}
                        secondary={props.metadata.summary}
                    />
                </ListItem>
            </Match>
        </Switch>
    );
}

const FeedPage: Component = () => {
    const data = useParams<{ feed: string; post?: string }>();
    const searchParams = useSearchParams<{ parent_id: string }>();
    const [query, setQuery] = useSearchParams<{
        ref_gt: string;
        ref_le: string;
        limit: string;
    }>();
    const client = useClient();
    const [fetchStat, setFetchStat] = createSignal<
        "initial" | "fetching" | "error" | "ready"
    >("initial");
    const [postBuffer, setPostBuffer] = createStore<readonly PublicPost[]>([]);
    const [isListEnded, setIsListEnded] = createSignal(false);
    const limit = () => {
        if (query.limit) {
            return Number(query.limit);
        } else {
            return undefined;
        }
    };
    const [feedMetadata] = createResource(data.feed, (feedUrlBak3) => {
        return aunwrap(getFeedInfo(client, feedUrlBak3));
    });

    const loadMorePosts = async () => {
        if (isListEnded()) return;
        const maxPubTime =
            postBuffer.length > 0
                ? Math.min.apply(
                      undefined,
                      postBuffer.map((p) => p.publishedAt)
                  )
                : undefined;
        setFetchStat("fetching");
        await aeither(
            {
                left(l) {
                    setFetchStat("error");
                },
                right(r) {
                    setPostBuffer((prev) => {
                        return [
                            ...prev,
                            ...r.posts.filter(
                                (p) => !prev.map((v) => v.ref).includes(p.ref)
                            ),
                        ];
                    });
                    setFetchStat("ready");
                    if (r.posts.length === 0) {
                        setIsListEnded(true);
                    }
                },
            },
            getFeedPosts(client, data!.feed, {
                pubBefore: maxPubTime,
                limit: limit(),
            })
        );
    };

    onMount(() => {
        loadMorePosts();
    });

    const onScrollBoxScroll = (ev: Event) => {
        const target = ev.target as HTMLElement;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight) {
            loadMorePosts();
        }
    };
    return (
        <div
            style={{ height: "100vh", overflow: "auto" }}
            onScroll={onScrollBoxScroll}
        >
            <Outlet /> {/* For post dialog */}
            <SharedAppBar>
                <Show
                    when={feedMetadata.state == "ready"}
                    fallback={
                        <Box sx={{ flex: "1", display: "flex" }}>
                            <CircularProgress color="inherit" size={20} />
                        </Box>
                    }
                >
                    <ToolbarTitle
                        primary={feedMetadata()?.title || "No title"}
                    />
                </Show>
                <Box sx={{ display: "flex" }}></Box>
            </SharedAppBar>
            <Box
                sx={{
                    position: "relative",
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
                class={CommonStyle.SmartBodyWidth}
            >
                <Card sx={{ marginTop: "24px" }}>
                    <List>
                        <For each={postBuffer}>
                            {(item, index) => {
                                return (
                                    <>
                                        <Show when={index() !== 0}>
                                            <Divider />
                                        </Show>

                                        <PostListItem
                                            metadata={item}
                                            feedUrlBlake3={data.feed}
                                        />
                                    </>
                                );
                            }}
                        </For>
                    </List>
                    <Show when={fetchStat() === "fetching"}>
                        <LinearProgress />
                    </Show>
                </Card>
            </Box>
            <Box
                sx={{
                    justifyContent: "end",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "end",
                    margin: "16px",
                }}
            >
                <Show when={isListEnded()} fallback={<Typography></Typography>}>
                    <Typography>That's the end.</Typography>
                </Show>
                <Typography>
                    Updated{" "}
                    {feedMetadata.state == "ready"
                        ? formatDistance(
                              new Date(feedMetadata().lastFetchedAt * 1000),
                              new Date(),
                              { addSuffix: true }
                          )
                        : "..."}
                </Typography>
                <Show
                    when={
                        feedMetadata.state == "ready" &&
                        typeof feedMetadata().link !== "undefined"
                    }
                >
                    <Link href={feedMetadata()!.link} target="_blank">
                        Go to {new URL(feedMetadata()!.link!).hostname}...
                    </Link>
                </Show>
            </Box>
        </div>
    );
};

export default FeedPage;
