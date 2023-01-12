import {
    List,
    ListItemButton,
    ListItemSecondaryAction,
    ListItemText,
    ListSubheader,
    Paper,
} from "@suid/material";
import { format, intlFormat, isSameDay, subDays } from "date-fns";
import { Component, createMemo, For } from "solid-js";

import { ChevronRight as ChevronRightIcon } from "@suid/icons-material";

import PostListItem from "../common/PostListItem";
import SharedAppBar from "../common/SharedAppBar";
import { useCurrentTime, useLiveQuery } from "../common/utils";
import {
    makeTimeline,
    TimelineEntry,
    TimelinePost,
    TimelineSeprator,
} from "../stores/timeline";
import CommonStyle from "../common/Style.module.css";
import { useSync } from "../common/synmgr";
import { useNavigate } from "../common/nav";
import { useScaffold } from "../common/Scaffold";
import guardSignIn from "../common/guardSignIn";
import { useDateFnLocale, useI18n } from "../platform/i18n";

import "../common/patchs/mui-list.css";
import "./timeline.css";

async function getTimelineArray() {
    const result: TimelineEntry[][] = [];
    for (const entry of await makeTimeline()) {
        if (entry.kind === "sep") {
            result.push([]);
        }
        result[result.length - 1].push(entry);
    }
    return result;
}

function formatDay(
    day: Date,
    today: Date,
    localised: {
        dayFormat: string;
        todayKw: string;
        yesterdayKw: string;
        dateFnLocale: Locale;
    }
) {
    if (isSameDay(day, today)) {
        return localised.todayKw;
    } else if (isSameDay(day, subDays(today, 1))) {
        return localised.yesterdayKw;
    } else {
        return format(day, localised.dayFormat, {
            locale: localised.dateFnLocale,
        });
    }
}

const TimelinePage: Component = () => {
    useSync();
    guardSignIn();
    const timeline = useLiveQuery(getTimelineArray);
    const currentTime = useCurrentTime(60 * 60 * 1000);
    const navigate = useNavigate();
    const scaffoldCx = useScaffold();
    const [t] = useI18n();
    const dateFnLocale = useDateFnLocale();

    const formatDayLocalisedOpts = createMemo(() => ({
        dayFormat: t("localDayFormatDateFn", undefined, "MMM do"),
        todayKw: t("today"),
        yesterdayKw: t("yesterday"),
        dateFnLocale: dateFnLocale(),
    }));
    return (
        <>
            <SharedAppBar
                title={t("timeline")}
                forceLeftIcon="drawer"
                hide={scaffoldCx.state.scrollingDown}
            />
            <style>{`.timeline-list .MuiPaper-root { border-radius: 2px }`}</style>
            <main>
                <List
                    role="feed"
                    aria-busy={timeline() ? "false" : "true"}
                    class={
                        /* @once */ `${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX} timeline-list`
                    }
                    aria-label={t("timeline")}
                >
                    <For each={timeline()}>
                        {(section, index) => {
                            const headerData = section[0] as TimelineSeprator;
                            const posts = section.slice(1) as TimelinePost[];
                            const preSectionCount = timeline()!
                                .slice(undefined, index() + 1)
                                .map((e) => e.length - 1) // exclude the header data
                                .reduce((p, c) => p + c);
                            return (
                                <>
                                    <ListSubheader>
                                        {formatDay(
                                            headerData.day,
                                            currentTime(),
                                            formatDayLocalisedOpts()
                                        )}
                                    </ListSubheader>
                                    <Paper>
                                        <For each={posts}>
                                            {(entry, entryIndex) => {
                                                const currentIndex =
                                                    preSectionCount +
                                                    entryIndex();
                                                return (
                                                    <PostListItem
                                                        feedUrlBlake3={
                                                            entry.feedUrlBlake3
                                                        }
                                                        metadata={entry.post}
                                                        divider
                                                        aria-posinset={currentIndex.toString()}
                                                        aria-setsize={timeline()!.length.toString()}
                                                    />
                                                );
                                            }}
                                        </For>
                                    </Paper>
                                </>
                            );
                        }}
                    </For>
                    <div style={{ height: "20px" }} />
                    <ListItemButton
                        onClick={() => navigate("/feedlists/default")}
                    >
                        <ListItemText
                            primary={t("timelineVisitDefaultList", {
                                listName: t("listNameSubscribed"),
                            })}
                            primaryTypographyProps={{ color: "primary" }}
                        />
                        <ListItemSecondaryAction>
                            <ChevronRightIcon color="primary" />
                        </ListItemSecondaryAction>
                    </ListItemButton>
                </List>
            </main>
        </>
    );
};

export default TimelinePage;
