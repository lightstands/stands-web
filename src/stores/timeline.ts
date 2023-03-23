import { isSameDay } from "date-fns";
import { PublicPost } from "lightstands-js";
import { MyDatabase } from "./db";
import { isPostTagged } from "./tags";
export type TimelinePost = {
    kind: "post";
    post: PublicPost;
    feedUrlBlake3: string;
    read: boolean;
};

export type TimelineGroup = {
    day: Date;
    posts: TimelinePost[];
    startIdx: number;
};

export type Timeline = {
    groups: TimelineGroup[];
    total: number;
};

export async function makeTimeline(db: MyDatabase): Promise<Timeline> {
    const mostRecentEntry = await db.postmetas
        .orderBy("publishedAt")
        .reverse()
        .first();
    const result: TimelineGroup[] = [];
    let currentGroup: TimelineGroup | undefined;
    let total = 0;
    if (mostRecentEntry) {
        const recentEntries = (
            await db.postmetas
                .where("publishedAt")
                .aboveOrEqual(mostRecentEntry.publishedAt - 60 * 60 * 24 * 14)
                .sortBy("publishedAt")
        ).reverse();
        total = recentEntries.length;
        let idx = 0;
        for (const entry of recentEntries) {
            const entryPublishedDate = new Date(entry.publishedAt * 1000);
            if (
                !currentGroup ||
                !isSameDay(currentGroup.day, entryPublishedDate)
            ) {
                currentGroup = {
                    day: entryPublishedDate,
                    posts: [],
                    startIdx: idx,
                };
                result.push(currentGroup);
            }
            const feedUrlBlake3 = (await db.feedmetas.get(entry.feedRef))
                ?.urlBlake3;
            if (feedUrlBlake3) {
                currentGroup.posts.push({
                    kind: "post",
                    post: entry,
                    feedUrlBlake3,
                    read: await isPostTagged(entry.ref, "_read"),
                });
            }
            idx++;
        }
    }
    return {
        groups: result,
        total,
    };
}
