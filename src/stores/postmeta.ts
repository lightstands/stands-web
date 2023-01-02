import {
    ClientConfig,
    PublicPost,
    getPost as getPostFromNetwork,
    Left,
    NotFoundError,
    isRight,
    unbox,
    getFeedPosts,
} from "lightstands-js";
import { openDb, MyDatabase } from "./db";
import { default as rootLogger } from "../logger";
import { isMeetSynTime, setLasySynTime } from "./lastsyn";
import { synchronised } from "../common/locks";
import { getAllIncludedFeedsBlake3 } from "./feedlists";
import { getFeedInfo, getLocalFeedMetaByBlake3 } from "./feedmeta";

const logger = rootLogger.child({ c: "stores/postmeta" });

/** Update local copy of one post metadata
 *
 * @param db
 * @param meta
 * @returns true if the metadata have been exists (and being updated), false if the metadata inserted
 */
async function updateLocalPostMeta(db: MyDatabase, meta: PublicPost) {
    return await db.transaction("rw", db.postmetas, async () => {
        const old = await db.postmetas.get(meta.ref);
        if (old) {
            await db.postmetas.update(old.ref, {
                ...meta,
                fetchedAt: new Date().getTime(),
            });
            return true;
        } else {
            await db.postmetas.add({
                ...meta,
                fetchedAt: new Date().getTime(),
            });
            return false;
        }
    });
}

export async function getPost(
    client: ClientConfig,
    feedUrlBlake3Base64: string,
    postIdBlake3Base64: string
) {
    const db = await openDb();
    const feedMeta = await db.feedmetas
        .where({ urlBlake3: feedUrlBlake3Base64 })
        .first();
    if (!feedMeta) {
        return Left(new NotFoundError("feed_url_blake3"));
    }
    const localPostMeta = await db.postmetas
        .where({ feedRef: feedMeta.ref, idBlake3: postIdBlake3Base64 })
        .first();
    if (localPostMeta) {
        getPostFromNetwork(
            client,
            feedUrlBlake3Base64,
            postIdBlake3Base64
        ).then((r) => {
            if (isRight(r)) {
                updateLocalPostMeta(db, unbox(r));
            }
        });
        return localPostMeta;
    } else {
        const remoteResult = await getPostFromNetwork(
            client,
            feedUrlBlake3Base64,
            postIdBlake3Base64
        );
        if (isRight(remoteResult)) {
            updateLocalPostMeta(db, unbox(remoteResult));
        } else {
            return remoteResult;
        }
    }
}

async function _fetchNewPostsOf(client: ClientConfig, feedRef: number) {
    const db = await openDb();
    const feedInfo = await db.feedmetas.where({ ref: feedRef }).first();
    if (!feedInfo) {
        throw new NotFoundError("feed_url_blake3");
    }
    const latestEntry = (
        await db.postmetas.where({ feedRef }).sortBy("publishedAt")
    ).pop();
    let minPubTime = latestEntry?.publishedAt || 0;
    let fetchedNumber = 0;
    let stillNewPostsMark = true;
    while (stillNewPostsMark) {
        const result = await getFeedPosts(client, feedInfo.urlBlake3, {
            pubSince: minPubTime,
        });
        if (isRight(result)) {
            const data = unbox(result);
            if (data.posts.length > 0) {
                for (const el of data.posts) {
                    minPubTime = Math.max(minPubTime, el.publishedAt);
                    if (await updateLocalPostMeta(db, el)) {
                        // hit old posts, exit
                        stillNewPostsMark = false;
                    } else {
                        fetchedNumber += 1;
                    }
                }
            } else {
                return fetchedNumber;
            }
        } else {
            throw unbox(result);
        }
    }
}

export async function fetchNewPostsOf(client: ClientConfig, feedRef: number) {
    let result: number | undefined;
    await synchronised("fetch-post-meta", async () => {
        result = await _fetchNewPostsOf(client, feedRef);
    });
    return result;
}

async function _fetchOldPostsOf(client: ClientConfig, feedRef: number) {
    const db = await openDb();
    const feedInfo = await db.feedmetas.where({ ref: feedRef }).first();
    if (!feedInfo) {
        throw new NotFoundError("feed_url_blake3");
    }
    const oldestEntry = (
        await db.postmetas.where({ feedRef }).sortBy("publishedAt")
    ).shift();
    let maxPubTime = oldestEntry?.publishedAt;
    let fetchedNumber = 0;
    logger.trace({ act: "fetch-old-posts", feedRef }, "fetching old posts");
    while (true) {
        const result = await getFeedPosts(client, feedInfo.urlBlake3, {
            pubBefore: maxPubTime,
        });
        if (isRight(result)) {
            const data = unbox(result);
            if (data.posts.length > 0) {
                for (const el of data.posts) {
                    maxPubTime =
                        typeof maxPubTime !== "undefined"
                            ? Math.min(maxPubTime, el.publishedAt)
                            : el.publishedAt;
                    if (!(await updateLocalPostMeta(db, el))) {
                        fetchedNumber += 1;
                    }
                }
            } else {
                return fetchedNumber;
            }
        } else {
            throw unbox(result);
        }
    }
}

export async function fetchOldPostsOf(client: ClientConfig, feedRef: number) {
    let result: number | undefined;
    await synchronised("fetch-post-meta", async () => {
        result = await _fetchOldPostsOf(client, feedRef);
    });
    return result;
}

export async function getAllPostsOf(
    feedRef: number,
    opts: { pubOrder: "asc" | "desc" }
) {
    const db = await openDb();
    const result = await db.postmetas.where({ feedRef }).sortBy("publishedAt");
    if (opts.pubOrder === "desc") {
        return result.reverse();
    } else {
        return result;
    }
}

export async function resetPostMeta() {
    const db = await openDb();
    await db.postmetas.clear();
}

export async function syncPostMetaOf(client: ClientConfig, feedRef: number) {
    const tag = ["post-meta", feedRef.toString()];
    logger.trace({ act: "sync-post-meta", feedRef });
    if (isMeetSynTime(tag, 30 * 60)) {
        setLasySynTime(tag, new Date().getTime());
        return await fetchNewPostsOf(client, feedRef);
    } else {
        logger.debug(
            { act: "sync-post-meta", feedRef, r: "skipped" },
            "local copy is not expired, fetching skipped"
        );
    }
}

export async function syncAllPostMeta(client: ClientConfig) {
    const feeds = await getAllIncludedFeedsBlake3();
    for (const urlBk3 of feeds) {
        const feed = await getLocalFeedMetaByBlake3(urlBk3);
        if (feed) {
            await syncPostMetaOf(client, feed.ref);
        } else {
            const updatedFeed = await getFeedInfo(client, urlBk3);
            if (isRight(updatedFeed)) {
                await syncPostMetaOf(client, unbox(updatedFeed).ref);
            }
        }
    }
}
