import { Outlet, useParams } from "@solidjs/router";
import {
    Component,
    createEffect,
    createResource,
    createSignal,
    createUniqueId,
    For,
    onCleanup,
    onMount,
    Show,
} from "solid-js";
import {
    OpenInNew as OpenInNewIcon,
    FilterList as FilterListIcon,
    FilterListOff as FilterListOffIcon,
} from "@suid/icons-material";
import { aunwrap, PublicPost } from "lightstands-js";

import {
    CircularProgress,
    Typography,
    Box,
    Link,
    ListItemButton,
    Card,
    ListItemText,
    Divider,
    LinearProgress,
    List,
    ListItemIcon,
    Chip,
    Button,
    Popover,
    ListSubheader,
    Radio,
    FormControl,
    RadioGroup,
    FormControlLabel,
} from "@suid/material";
import { formatDistance } from "date-fns";
import { useStore } from "@nanostores/solid";

import { settingStore } from "../stores/settings";
import { useSearchParams } from "../common/nav";
import { useSync } from "../common/synmgr";
import { getFeedInfo, getLocalFeedMetaByBlake3 } from "../stores/feedmeta";
import { useLiveQuery } from "../common/utils";
import { fetchOldPostsOf, getAllPostsOf } from "../stores/postmeta";
import SharedAppBar from "../common/SharedAppBar";
import CommonStyle from "../common/Style.module.css";
import { useScaffold } from "../common/Scaffold";
import "./feed.css";
import { isPostTagged } from "../stores/tags";
import AdvMenu from "../common/AdvMenu";
import { useClient } from "../client";
import ToolbarTitle from "../common/ToolbarTitle";

import PostListItem from "../common/PostListItem";
import { useDateFnLocale, useI18n } from "../common/i18n-wrapper";
import { openExternalUrl } from "../platform/open-url";

function isLiveQueryReady<T>(
    accessor: () => T | undefined
): accessor is () => T {
    return typeof accessor() !== "undefined";
}

const FeedPage: Component = () => {
    useSync();
    let listEndEl: HTMLDivElement;
    let filterButEl: HTMLButtonElement;
    const data = useParams<{ feed: string; post?: string }>();
    const [searchParams, setSearchParams] = useSearchParams<{
        parent_id: string;
        filter_tag: string;
    }>();
    const client = useClient();
    const [fetchStat, setFetchStat] = createSignal<
        "initial" | "fetching" | "error" | "ready"
    >("initial");
    const [isListEnded, setIsListEnded] = createSignal(false);
    const feedMetadata = useLiveQuery(async () => {
        return await aunwrap(getFeedInfo(client, data.feed));
    });
    const allPosts = useLiveQuery(async () => {
        const feed = await getLocalFeedMetaByBlake3(data.feed);
        if (!feed) {
            return [];
        }
        return await getAllPostsOf(feed.ref, { pubOrder: "desc" });
    });
    let shouldLoadMorePosts = false;
    const scaffoldCx = useScaffold();

    const filterPopId = createUniqueId();
    const [filterPopOpen, setFilterPopOpen] = createSignal(false);

    const settings = useStore(settingStore);

    const [t] = useI18n();
    const dateFnLocale = useDateFnLocale();

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

    const [filteredPosts] = createResource(
        (): [PublicPost[] | undefined, string | undefined] => [
            allPosts(),
            searchParams.filter_tag,
        ],
        async ([posts, filterTag]) => {
            if (posts) {
                const result = [];
                for (const post of posts as PublicPost[]) {
                    if (await applyFilter(post)) {
                        result.push(post);
                    }
                }
                return result;
            } else {
                return [];
            }
        }
    );

    const loadMorePosts = async () => {
        if (isListEnded()) return;
        const feedRef = feedMetadata()?.ref;
        if (typeof feedRef !== "undefined") {
            if ((await fetchOldPostsOf(client, feedRef)) === 0) {
                setIsListEnded(true);
            }
        }
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

    const hasFilter = () => !!searchParams.filter_tag;

    const unsetFilterTag = () => {
        setSearchParams({
            filter_tag: null,
        });
    };

    const setFilterTag = async (filterTag: string, replace?: boolean) => {
        setSearchParams(
            {
                filter_tag: filterTag ? filterTag : undefined,
            },
            { replace: replace }
        );
    };

    onMount(() => {
        listEndInsetOb.observe(listEndEl);

        if (!searchParams.filter_tag && settings().feedDefaultFilterTag) {
            setFilterTag(settings().feedDefaultFilterTag, true);
        }
    });

    createEffect(() => {
        const meta = feedMetadata();
        if (meta) {
            loadMorePosts();
        }
    });

    onCleanup(() => {
        listEndInsetOb.disconnect();
    });
    return (
        <>
            <Outlet /> {/* For post dialog */}
            <SharedAppBar
                position="sticky"
                hide={scaffoldCx.state.scrollingDown}
            >
                <Show
                    when={isLiveQueryReady(feedMetadata)}
                    fallback={
                        <Box sx={{ flex: "1", display: "flex" }}>
                            <CircularProgress color="inherit" size={20} />
                        </Box>
                    }
                >
                    <ToolbarTitle
                        primary={feedMetadata()?.title || t("noTitle")}
                    />
                </Show>
                <Box
                    class={CommonStyle.FlexboxRow}
                    sx={{ justifyContent: "end" }}
                >
                    <AdvMenu
                        expanded={[]}
                        hidden={[
                            <ListItemButton
                                disabled={
                                    !isLiveQueryReady(feedMetadata) ||
                                    typeof feedMetadata()?.link === "undefined"
                                }
                                onClick={() =>
                                    openExternalUrl(feedMetadata()!.link!)
                                }
                            >
                                <ListItemIcon>
                                    <OpenInNewIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={t("visitWebsiteAction")}
                                />
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
                                label={t("postTagRead")}
                                onDelete={unsetFilterTag}
                                color="primary"
                            />
                        </Show>

                        <Show when={searchParams.filter_tag === "!_read"}>
                            <Chip
                                label={t("postTagUnread")}
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
                            aria-description={t("feedFilterExplain")}
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
                            {t("filter")}
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
                                        {t("filterTagTitle")}
                                    </ListSubheader>

                                    <RadioGroup
                                        aria-labelledby="filter-tag-label"
                                        name="filter-tag"
                                        value={searchParams.filter_tag || ""}
                                        onChange={async (ev, value) => {
                                            await setFilterTag(value, true);
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
                                            label={t("feedFilterUnset")}
                                        />
                                        <FormControlLabel
                                            sx={{
                                                width: "100%",
                                                marginLeft: 0,
                                                paddingLeft: 0,
                                            }}
                                            value={"!_read"}
                                            control={<Radio size="small" />}
                                            label={t("postTagUnread")}
                                        />
                                        <FormControlLabel
                                            sx={{
                                                width: "100%",
                                                marginLeft: 0,
                                                paddingLeft: 0,
                                            }}
                                            value={"_read"}
                                            control={<Radio size="small" />}
                                            label={t("postTagRead")}
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </List>
                        </Popover>
                    </Box>
                </Box>
                <Card>
                    <List class="post-list">
                        <For each={filteredPosts()}>
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
                    <Typography>{t("feedTheEnd")}</Typography>
                </Show>
                <Typography>
                    {t("feedUpdatedAt", {
                        dt: isLiveQueryReady(feedMetadata)
                            ? formatDistance(
                                  new Date(feedMetadata().lastFetchedAt * 1000),
                                  new Date(),
                                  { addSuffix: true, locale: dateFnLocale() }
                              )
                            : "...",
                    })}
                </Typography>
            </Box>
        </>
    );
};

export default FeedPage;
