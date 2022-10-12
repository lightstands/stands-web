import {
    Outlet,
    useNavigate,
    useParams,
    useSearchParams,
} from "@solidjs/router";
import AppBar from "@suid/material/AppBar";
import IconButton from "@suid/material/IconButton";
import Toolbar from "@suid/material/Toolbar";
import { Component, createResource, For, Match, Show, Switch } from "solid-js";
import { useScaffold } from "../common/Scaffold";
import {
    Menu as MenuIcon,
    OpenInNew as OpenInNewIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from "@suid/icons-material";
import ToolbarTitle from "../common/ToolbarTitle";
import {
    aunwrap,
    FeedPostListPage,
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
    const [query, setQuery] = useSearchParams<{
        ref_gt: string;
        ref_le: string;
        limit: string;
    }>();
    const scaffoldCx = useScaffold();
    const client = useClient();
    const refGt = () => {
        if (query.ref_gt) {
            return Number(query.ref_gt);
        } else {
            return undefined;
        }
    };
    const refLe = () => {
        if (query.ref_le) {
            return Number(query.ref_le);
        } else {
            return undefined;
        }
    };
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
    const [postList, postListResCtl] = createResource<
        FeedPostListPage,
        [string, number | undefined, number | undefined, number | undefined],
        FeedPostListPage
    >(
        () => [data.feed, refGt(), refLe(), limit()],
        ([feedUrlBlake3, refGt, refLe, limit]) => {
            return aunwrap(
                getFeedPosts(client, feedUrlBlake3, {
                    refGt: refGt,
                    refLe: refLe,
                    limit: limit,
                })
            );
        }
    );

    /** Go to next page.
     * This function assumes:
     * - `postList` is already loaded
     * - `postList().nextRefGt` is a number
     */
    const nextPage = async () => {
        setQuery({
            ref_le: null,
            ref_gt: postList()!.nextRefGt!,
            limit: limit(),
        });
        postListResCtl.refetch();
    };

    /** Go to previous page.
     * This function assumes:
     * - `refGt()` is a number
     */
    const prevPage = async () => {
        setQuery({
            ref_gt: null,
            ref_le: refGt(),
            limit: limit(),
        });
        postListResCtl.refetch();
    };
    return (
        <>
            <Outlet /> {/* For post dialog */}
            <AppBar position="static">
                <Toolbar>
                    <Show when={scaffoldCx.state.drawerType === "temporary"}>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            sx={{ mr: 2 }}
                            onClick={() =>
                                scaffoldCx.setDrawerOpen(
                                    !scaffoldCx.state.drawerOpen
                                )
                            }
                        >
                            <MenuIcon />
                        </IconButton>
                    </Show>
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
                </Toolbar>
            </AppBar>
            <Box
                sx={{
                    position: "relative",
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
                class={Style["auto-width"]}
            >
                <Switch>
                    <Match when={postList.state === "ready"}>
                        <Card sx={{ marginTop: "24px" }}>
                            <List>
                                <For each={postList()!.posts}>
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
                        </Card>
                    </Match>
                    <Match
                        when={
                            postList.state === "pending" ||
                            postList.state === "refreshing" ||
                            postList.state === "unresolved"
                        }
                    >
                        <Card
                            sx={{
                                marginTop: "24px",
                            }}
                        >
                            <LinearProgress />
                            <Typography sx={{ textAlign: "center" }}>
                                Reading posts from LightStands...
                            </Typography>
                        </Card>
                    </Match>
                </Switch>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    paddingX: "20%",
                    paddingY: "20px",
                }}
            >
                <Box
                    sx={{ display: "flex", justifyContent: "left", flex: "1" }}
                >
                    <IconButton
                        size="large"
                        disabled={
                            typeof refGt() === "undefined" || refGt() === 0
                        }
                        onClick={prevPage}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                </Box>
                <Box
                    sx={{ display: "flex", justifyContent: "right", flex: "1" }}
                >
                    <IconButton
                        size="large"
                        disabled={typeof postList()?.nextRefGt === "undefined"}
                        onClick={nextPage}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
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
        </>
    );
};

export default FeedPage;
