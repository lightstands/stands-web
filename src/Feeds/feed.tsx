import { Outlet, useParams } from "@solidjs/router";
import {
    batch,
    Component,
    createResource,
    createSignal,
    createUniqueId,
    For,
    Match,
    onCleanup,
    onMount,
    Show,
    Switch,
} from "solid-js";
import {
    OpenInNew as OpenInNewIcon,
    FilterList as FilterListIcon,
    FilterListOff as FilterListOffIcon,
} from "@suid/icons-material";
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
import { useScaffold } from "../common/Scaffold";
import "./feed.css";
import { isPostTagged } from "../stores/tags";
import AdvMenu from "../common/AdvMenu";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemIcon from "@suid/material/ListItemIcon";
import Chip from "@suid/material/Chip";
import Button from "@suid/material/Button";
import Popover from "@suid/material/Popover";
import ListSubheader from "@suid/material/ListSubheader";
import Radio from "@suid/material/Radio";
import FormControl from "@suid/material/FormControl";
import RadioGroup from "@suid/material/RadioGroup";
import FormControlLabel from "@suid/material/FormControlLabel";
import { useStore } from "@nanostores/solid";
import { settingStore } from "../stores/settings";
import { useNavigate, useSearchParams } from "../common/nav";
import { triggerSync } from "../common/synmgr";

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
    triggerSync(["tags"]);
    let listEndEl: HTMLDivElement;
    let filterButEl: HTMLButtonElement;
    const data = useParams<{ feed: string; post?: string }>();
    const [searchParams, setSearchParams] = useSearchParams<{
        parent_id: string;
        filter_tag: string;
        limit: string;
    }>();
    const client = useClient();
    const [fetchStat, setFetchStat] = createSignal<
        "initial" | "fetching" | "error" | "ready"
    >("initial");
    const [postBuffer, setPostBuffer] = createSignal<readonly PublicPost[]>(
        [],
        {
            equals: (prev, next) => {
                return (
                    prev.length === next.length &&
                    prev.every((v, i) => v === next[i])
                );
            },
        }
    );
    const [isListEnded, setIsListEnded] = createSignal(false);
    const limit = () => {
        if (searchParams.limit) {
            return Number(searchParams.limit);
        } else {
            return undefined;
        }
    };
    const [feedMetadata] = createResource(data.feed, (feedUrlBak3) => {
        return aunwrap(getFeedInfo(client, feedUrlBak3));
    });
    let shouldLoadMorePosts = false;
    const scaffoldCx = useScaffold();

    const filterPopId = createUniqueId();
    const [filterPopOpen, setFilterPopOpen] = createSignal(false);

    const settings = useStore(settingStore);

    const applyFilter = async (post: PublicPost) => {
        if (searchParams.filter_tag) {
            const expr = searchParams.filter_tag;
            if (expr[0] === "!") {
                return !(await isPostTagged(post.ref, expr.slice(1)));
            } else {
                return await isPostTagged(post.ref, expr);
            }
        }
        return true;
    };

    const loadMorePosts = async () => {
        if (isListEnded()) return;
        const maxPubTime =
            postBuffer().length > 0
                ? Math.min.apply(
                      undefined,
                      postBuffer().map((p) => p.publishedAt)
                  )
                : undefined;
        setFetchStat("fetching");
        await aeither(
            {
                left(l) {
                    setFetchStat("error");
                },
                async right(r) {
                    const posts: PublicPost[] = [];
                    for (const p of r.posts) {
                        if (await applyFilter(p)) {
                            posts.push(p);
                        }
                    }
                    const oldRefs = new Set(postBuffer().map((v) => v.ref));
                    setPostBuffer((prev) => {
                        return [
                            ...prev,
                            ...posts.filter((v) => !oldRefs.has(v.ref)),
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

    const loadMorePostsIfPossible = () => {
        if (!shouldLoadMorePosts && !isListEnded()) {
            shouldLoadMorePosts = true;
            loadMorePosts();
            shouldLoadMorePosts = false;
        }
    };

    const listEndInsetOb = new IntersectionObserver((e) => {
        if (e[0].intersectionRatio > 0) {
            loadMorePostsIfPossible();
        }
    });

    const reloadWholeList = () => {
        batch(() => {
            setPostBuffer([]);
            setIsListEnded(false);
        });
        loadMorePosts();
    };

    const hasFilter = () => !!searchParams.filter_tag;

    const unsetFilterTag = () => {
        setSearchParams({
            filter_tag: null,
        });
        reloadWholeList();
    };

    const setFilterTag = async (filterTag: string, replace?: boolean) => {
        setSearchParams(
            {
                filter_tag: filterTag ? filterTag : undefined,
            },
            { replace: replace }
        );
        reloadWholeList();
    };

    onMount(() => {
        listEndInsetOb.observe(listEndEl);
        if (!searchParams.filter_tag && settings().feedDefaultFilterTag) {
            setFilterTag(settings().feedDefaultFilterTag, true);
        }
    });

    onCleanup(() => {
        listEndInsetOb.disconnect();
    });
    return (
        <>
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
                <Box
                    class={CommonStyle.FlexboxRow}
                    sx={{ justifyContent: "end" }}
                >
                    <AdvMenu
                        suggestWidth={
                            scaffoldCx.state.suggestExpandableMenuWidth ||
                            undefined
                        }
                        expanded={[]}
                        onExpandedIconNumberChanged={() => {}}
                        totalIconNumber={1}
                        hidden={[
                            <ListItemButton
                                disabled={
                                    feedMetadata.state !== "ready" ||
                                    typeof feedMetadata()?.link === "undefined"
                                }
                                onClick={() =>
                                    window.open(feedMetadata()!.link, "_blank")
                                }
                            >
                                <ListItemIcon>
                                    <OpenInNewIcon />
                                </ListItemIcon>
                                <ListItemText primary="Visit the website..." />
                            </ListItemButton>,
                        ]}
                    />
                </Box>
            </SharedAppBar>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <div style="height: 8px"></div>
                <Box
                    aria-label="Filters"
                    class={CommonStyle.FlexboxRow}
                    sx={{ marginX: "12px", marginBottom: "2px" }}
                >
                    <Box
                        class={CommonStyle.FlexboxRow}
                        sx={{ alignItems: "center" }}
                    >
                        <Show when={searchParams.filter_tag === "_read"}>
                            <Chip
                                label="Read"
                                onDelete={unsetFilterTag}
                                color="primary"
                            />
                        </Show>

                        <Show when={searchParams.filter_tag === "!_read"}>
                            <Chip
                                label="Unread"
                                onDelete={unsetFilterTag}
                                color="primary"
                            />
                        </Show>
                    </Box>

                    <Box
                        class={CommonStyle.FlexboxRow}
                        sx={{
                            flexGrow: 1,
                            justifyContent: "end",
                        }}
                    >
                        <Button
                            ref={filterButEl!}
                            class="tooltip"
                            aria-description="Manage the filters applied on this page"
                            onClick={() => setFilterPopOpen(true)}
                        >
                            <Show
                                when={hasFilter()}
                                fallback={<FilterListOffIcon />}
                            >
                                <FilterListIcon
                                    sx={{
                                        paddingInlineEnd: "4px",
                                    }}
                                />
                            </Show>
                            Filter
                        </Button>
                        <Popover
                            id={filterPopId}
                            open={filterPopOpen()}
                            onClose={() => setFilterPopOpen(false)}
                            anchorEl={filterButEl!}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            PaperProps={{ sx: { borderRadius: "2px" } }}
                        >
                            <List disablePadding sx={{ minWidth: "160px" }}>
                                <FormControl sx={{ width: "100%" }}>
                                    <ListSubheader id="filter-tag-label">
                                        Read or Not
                                    </ListSubheader>

                                    <RadioGroup
                                        aria-labelledby="filter-tag-label"
                                        name="filter-tag"
                                        value={searchParams.filter_tag || ""}
                                        onChange={async (ev, value) => {
                                            await setFilterTag(value);
                                            setFilterPopOpen(false);
                                        }}
                                    >
                                        <FormControlLabel
                                            sx={{
                                                width: "100%",
                                                marginLeft: 0,
                                                paddingLeft: 0,
                                            }}
                                            value={""}
                                            control={<Radio size="small" />}
                                            label="Unset"
                                        />
                                        <FormControlLabel
                                            sx={{
                                                width: "100%",
                                                marginLeft: 0,
                                                paddingLeft: 0,
                                            }}
                                            value={"!_read"}
                                            control={<Radio size="small" />}
                                            label="Unread"
                                        />
                                        <FormControlLabel
                                            sx={{
                                                width: "100%",
                                                marginLeft: 0,
                                                paddingLeft: 0,
                                            }}
                                            value={"_read"}
                                            control={<Radio size="small" />}
                                            label="Read"
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </List>
                        </Popover>
                    </Box>
                </Box>
                <Card>
                    <List class="post-list">
                        <For each={postBuffer()}>
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
                ref={listEndEl!}
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
        </>
    );
};

export default FeedPage;
