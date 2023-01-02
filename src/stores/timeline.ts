import { isSameDay } from "date-fns";
import { PublicPost } from "lightstands-js";
import { openDb } from "./db";
import { isPostTagged } from "./tags";

export type TimelineSeprator = {
    kind: "sep";
    day: Date;
};

export type TimelinePost = {
    kind: "post";
    post: PublicPost;
    feedUrlBlake3: string;
    read: boolean;
};

export type TimelineEntry = TimelineSeprator | TimelinePost;

export async function* makeTimeline(): AsyncGenerator<
    TimelineEntry,
    void,
    void
> {
    const db = await openDb();
    const mostRecentEntry = await db.postmetas
        .orderBy("publishedAt")
        .reverse()
        .first();
    if (mostRecentEntry) {
        const recentEntries = (
            await db.postmetas
                .where("publishedAt")
                .aboveOrEqual(mostRecentEntry.publishedAt - 60 * 60 * 24 * 14)
                .sortBy("publishedAt")
        ).reverse();
        let currentDay: Date | undefined;
        for (const entry of recentEntries) {
            const entryPublishedDate = new Date(entry.publishedAt * 1000);
            if (!currentDay || !isSameDay(currentDay, entryPublishedDate)) {
                currentDay = entryPublishedDate;
                yield {
                    kind: "sep",
                    day: currentDay,
                };
            }
            const feedUrlBlake3 = (await db.feedmetas.get(entry.feedRef))
                ?.urlBlake3;
            if (feedUrlBlake3) {
                yield {
                    kind: "post",
                    post: entry,
                    feedUrlBlake3,
                    read: await isPostTagged(entry.ref, "_read"),
                };
            }
        }
    }
}
