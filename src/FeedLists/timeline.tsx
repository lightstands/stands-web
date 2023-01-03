import {
    List,
    ListItemButton,
    ListItemSecondaryAction,
    ListItemText,
    ListSubheader,
    Paper,
} from "@suid/material";
import { intlFormat, isSameDay, subDays } from "date-fns";
import { Component, For } from "solid-js";
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
import { ChevronRight as ChevronRightIcon } from "@suid/icons-material";
import { useNavigate } from "../common/nav";
import { useScaffold } from "../common/Scaffold";

async function getTimelineArray() {
    const result: TimelineEntry[][] = [];
    for await (const entry of makeTimeline()) {
        if (entry.kind === "sep") {
            result.push([]);
        }
        result[result.length - 1].push(entry);
    }
    return result;
}

function formatDay(day: Date, today: Date) {
    if (isSameDay(day, today)) {
        return "Today";
    } else if (isSameDay(day, subDays(today, 1))) {
        return "Yesterday";
    } else {
        return intlFormat(day, { month: "short", day: "numeric" });
    }
}

const TimelinePage: Component = () => {
    useSync();
    const timeline = useLiveQuery(getTimelineArray);
    const currentTime = useCurrentTime(60 * 60 * 1000);
    const navigate = useNavigate();
    const scaffoldCx = useScaffold();
    return (
        <>
            <SharedAppBar
                title="Timeline"
                forceLeftIcon="drawer"
                hide={scaffoldCx.state.scrollingDown}
            />
            <style>{`.timeline-list .MuiPaper-root { border-radius: 2px }`}</style>
            <List
                class={
                    /* @once */ `${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX} timeline-list`
                }
            >
                <For each={timeline()}>
                    {(section) => {
                        const headerData = section[0] as TimelineSeprator;
                        const posts = section.slice(1) as TimelinePost[];
                        return (
                            <>
                                <ListSubheader>
                                    {formatDay(headerData.day, currentTime())}
                                </ListSubheader>
                                <Paper>
                                    <For each={posts}>
                                        {(entry) => (
                                            <PostListItem
                                                feedUrlBlake3={
                                                    entry.feedUrlBlake3
                                                }
                                                metadata={entry.post}
                                                divider
                                            />
                                        )}
                                    </For>
                                </Paper>
                            </>
                        );
                    }}
                </For>
                <div style={{ height: "20px" }} />
                <ListItemButton onClick={() => navigate("/feedlists/default")}>
                    <ListItemText
                        primary={`Visit list "Subscribed"`}
                        primaryTypographyProps={{ color: "primary" }}
                    />
                    <ListItemSecondaryAction>
                        <ChevronRightIcon color="primary" />
                    </ListItemSecondaryAction>
                </ListItemButton>
            </List>
        </>
    );
};

export default TimelinePage;
