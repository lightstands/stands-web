import { MyDatabase, openDb } from "./db";
import {
    aeither,
    ClientConfig,
    Fork,
    getFeedInfo as getFeedInfoFromNetwork,
    isRight,
    NotFoundError,
    PublicFeed,
    Right,
    unboxRight,
} from "lightstands-js";
import { default as rootLogger } from "../logger";

const logger = rootLogger.child({ c: "stores/feedmeta" });

async function updateLocalFeedMeta(db: MyDatabase, feed: PublicFeed) {
    await db.transaction("rw", db.feedmetas, async () => {
        const record = await db.feedmetas.get(feed.ref);
        if (!record) {
            await db.feedmetas.add({
                ...feed,
                lastUsedAt: new Date().getTime(),
            });
        } else {
            if (feed.lastFetchedAt > record.lastFetchedAt) {
                // don't use equal here!
                // The update here will also trigger storagemutated in dexie,
                // the event will run all live query again,
                // and trigger getFeedInfo() in this file and run this function.
                // and the updates here will trigger storagemutated again.
                // The app will fall into infinite loop.
                await db.feedmetas.update(record.ref, {
                    ...feed,
                    lastUsedAt: new Date().getTime(),
                });
            }
        }
    });
}

const A_DAY_MS = 1000 * 60 * 60 * 24;

export async function setFeedMetaUsed(feedUrlBlake3: string) {
    const db = await openDb();
    await db.transaction("rw", db.feedmetas, async () => {
        const record = await db.feedmetas
            .where({ urlBlake3: feedUrlBlake3 })
            .first();
        if (record) {
            const currentTs = new Date().getTime();
            if (record.lastUsedAt + A_DAY_MS <= currentTs) {
                // reduce I/O by limiting the writing once per day
                await db.feedmetas.update(record.ref, {
                    lastUsedAt: currentTs,
                });
            }
        }
    });
}

/**
 * A drop-in replacement for `getFeedInfo` in lightstands-js, considered a presistent cache in Dexie (IndexedDB).
 * This function can be wrapped in useLiveQuery to get realtime update.
 * @param client
 * @param feedUrlBlake3Base64
 * @returns
 */
export async function getFeedInfo(
    client: ClientConfig,
    feedUrlBlake3Base64: string
): Fork<NotFoundError, PublicFeed> {
    const db = await openDb();
    const record = await db.feedmetas
        .where({ urlBlake3: feedUrlBlake3Base64 })
        .first();
    if (!record) {
        const feedMeta = await getFeedInfoFromNetwork(
            client,
            feedUrlBlake3Base64
        );
        if (isRight(feedMeta)) {
            await updateLocalFeedMeta(db, unboxRight(feedMeta));
        } else {
            setFeedMetaUsed(feedUrlBlake3Base64);
        }
        return feedMeta;
    } else {
        aeither(
            {
                left(l) {
                    logger.warn(
                        {
                            act: "fetch-feed-meta",
                            t: feedUrlBlake3Base64,
                            r: "failed",
                            e: l,
                            client: client,
                        },
                        "Failed to fetch meta of feed %s",
                        feedUrlBlake3Base64
                    );
                    setFeedMetaUsed(feedUrlBlake3Base64);
                },
                right(r) {
                    updateLocalFeedMeta(db, r);
                },
            },
            getFeedInfoFromNetwork(client, feedUrlBlake3Base64)
        );
        return Right(record); // use cache-first method here. Users may use useLiveQuery to get the update.
    }
}

export async function resetFeedMetas() {
    const db = await openDb();
    await db.feedmetas.clear();
}
