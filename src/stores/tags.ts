import {
    Session,
    patchPostTags,
    listReadTags,
    ClientConfig,
    aunwrap,
    SessionAccess,
} from "lightstands-js";
import { MyDatabase, openDb } from "./db";

interface Tag {
    postRef: number;
    tag: string;
    createdAt: number;
    updatedAt: number;
    data?: string;
}

export async function getPostTag(
    postRef: number,
    tag: string
): Promise<Tag | undefined> {
    const db = await openDb();
    const o = await db.postTags
        .where({
            post_ref: postRef,
            tag: tag,
        })
        .limit(1)
        .first();
    if (o) {
        return {
            postRef: o.post_ref,
            tag: o.tag,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            data: o.data,
        };
    } else {
        return undefined;
    }
}

/** Store an tag entry in database.
 *
 * @param db
 * @param postRef
 * @param tag
 * @param createdAt
 * @param updatedAt
 * @param feedUrlB3Base64
 * @param postIdB3Base64
 */
async function localTag(
    db: MyDatabase,
    postRef: number,
    tag: string,
    createdAt: number,
    updatedAt: number,
    isSync: boolean,
    feedUrlB3Base64?: string,
    postIdB3Base64?: string
) {
    await db.transaction("rw", db.postTags, async (trans) => {
        const tagObject = await db.postTags.get([postRef, tag]);
        if (tagObject) {
            await db.postTags.update([postRef, tag], {
                created_at: createdAt,
                updated_at: updatedAt,
                feedUrlB3Base64: feedUrlB3Base64,
                postIdB3Base64: postIdB3Base64,
                is_sync: isSync ? 1 : 0,
            });
        } else {
            await db.postTags.add({
                post_ref: postRef,
                tag,
                created_at: createdAt,
                updated_at: updatedAt,
                feed_url_blake3_base64: feedUrlB3Base64,
                post_id_blake3_base64: postIdB3Base64,
                is_sync: isSync ? 1 : 0,
            });
        }
    });
}

async function* fetchNewReadTags(
    client: ClientConfig,
    session: SessionAccess,
    db: MyDatabase,
    userId: number
) {
    const lastUpdatedTag = await db.postTags
        .orderBy("updated_at")
        .reverse()
        .filter((t) => t.tag === "_read" && Boolean(t.is_sync))
        .first();
    let lastUpdatedTime = lastUpdatedTag
        ? lastUpdatedTag.updated_at
        : undefined;
    let hasNext = true;
    while (hasNext) {
        const chunk = await aunwrap(
            listReadTags(client, session, userId, {
                updatedSince: lastUpdatedTime,
            })
        );
        hasNext = chunk.hasNext;
        if (chunk.tags.length > 0) {
            for (const tag of chunk.tags) {
                yield tag;

                lastUpdatedTime =
                    typeof lastUpdatedTime !== "undefined"
                        ? Math.min(tag.updatedAt, lastUpdatedTime)
                        : tag.updatedAt;
            }
        }
    }
}

async function getReadTagChanges(db: MyDatabase) {
    return await db.postTags
        .where(["tag", "is_sync"])
        .equals(["_read", 0])
        .toArray();
}

async function syncReadTags(
    client: ClientConfig,
    session: Session,
    db: MyDatabase,
    userId: number
) {
    {
        const changes = await getReadTagChanges(db);
        // pull new tags
        for await (const tag of fetchNewReadTags(client, session, db, userId)) {
            const changedTag = changes
                .filter((v) => v.post_ref === tag.postRef)
                .shift();
            if (changedTag) {
                // If we have the change, merge the change with received data
                // newer win and first to server win
                if (changedTag.updated_at < tag.updatedAt) {
                    continue; // keep the local change
                }
            }
            if (tag.untaggedAt && tag.untaggedAt >= tag.createdAt) {
                await db.postTags.delete([tag.postRef, tag.tag]);
            } else {
                await db.postTags.put(
                    {
                        post_ref: tag.postRef,
                        tag: tag.tag,
                        updated_at: tag.updatedAt,
                        created_at: tag.createdAt,
                        is_sync: 1,
                        feed_url_blake3_base64: changedTag
                            ? changedTag.feed_url_blake3_base64
                            : undefined,
                        post_id_blake3_base64: changedTag
                            ? changedTag.post_id_blake3_base64
                            : undefined,
                    },
                    [tag.postRef, tag.tag]
                );
            }
        }
    }
    // now push our changes
    {
        const changes = await getReadTagChanges(db);
        for (const tag of changes) {
            if (tag.feed_url_blake3_base64 && tag.post_id_blake3_base64) {
                if (tag.created_at > 0) {
                    await patchPostTags(
                        client,
                        session,
                        userId,
                        tag.feed_url_blake3_base64,
                        tag.post_id_blake3_base64,
                        {
                            tag: ["_read"],
                        }
                    );
                } else {
                    await patchPostTags(
                        client,
                        session,
                        userId,
                        tag.feed_url_blake3_base64,
                        tag.post_id_blake3_base64,
                        {
                            untag: ["_read"],
                        }
                    );
                }
                await db.postTags.update([tag.post_ref, tag.tag], {
                    is_sync: 1,
                });
            }
        }
    }
}

/** Synchronise tags between local database and remote
 *
 * @param client
 * @param session
 */
export async function syncTags(client: ClientConfig, session: Session) {
    const userId = session.accessTokenObject.userid;
    const db = await openDb();
    await Promise.all([syncReadTags(client, session, db, userId)]);
}

function getTimestamp() {
    return Math.floor(new Date().getTime() / 1000);
}

/** tag a post in local database
 *
 * @param tag
 * @param postRef
 * @param feedUrlB3Base64
 * @param postIdB3Base64
 */
export async function tagPost(
    tag: string,
    postRef: number,
    feedUrlB3Base64: string,
    postIdB3Base64: string
) {
    const db = await openDb();
    const ts = getTimestamp();
    await localTag(
        db,
        postRef,
        tag,
        ts,
        ts,
        false,
        feedUrlB3Base64,
        postIdB3Base64
    );
}

/** untag a post in local database
 *
 * @param tag
 * @param postRef
 * @param feedUrlB3Base64
 * @param postIdB3Base64
 */
export async function untagPost(
    tag: string,
    postRef: number,
    feedUrlB3Base64: string,
    postIdB3Base64: string
) {
    const db = await openDb();
    await localTag(
        db,
        postRef,
        tag,
        0,
        getTimestamp(),
        false,
        feedUrlB3Base64,
        postIdB3Base64
    );
}

/** tag a post and sync to lightstands.
 * It's cheaper than the 'sync later' option, since this operation can avoid the merging cost.
 *
 * This function will sliently fail when it could not sync the change to lightstands.
 *
 * @param client
 * @param session
 * @param userId
 * @param tag
 * @param postRef
 * @param feedUrlB3Base64
 * @param postIdB3Base64
 */
export async function tagPostAndSync(
    client: ClientConfig,
    session: SessionAccess,
    userId: number,
    tag: string,
    postRef: number,
    feedUrlB3Base64: string,
    postIdB3Base64: string
) {
    const db = await openDb();
    const ts = getTimestamp();
    await localTag(
        db,
        postRef,
        tag,
        ts,
        ts,
        false,
        feedUrlB3Base64,
        postIdB3Base64
    );
    try {
        await aunwrap(
            patchPostTags(
                client,
                session,
                userId,
                feedUrlB3Base64,
                postIdB3Base64,
                {
                    tag: [tag],
                }
            )
        );
    } catch (e) {
        console.error("tagPostAndSync", "sync error", e);
    }
}

/** untag a post and sync to lightstands.
 * It's cheaper than the 'sync later' option, since this operation can avoid the merging cost.
 *
 * This function will sliently fail when it could not sync the change to lightstands.
 *
 * @param client
 * @param session
 * @param userId
 * @param tag
 * @param postRef
 * @param feedUrlB3Base64
 * @param postIdB3Base64
 */
export async function untagPostAndSync(
    client: ClientConfig,
    session: SessionAccess,
    userId: number,
    tag: string,
    postRef: number,
    feedUrlB3Base64: string,
    postIdB3Base64: string
) {
    const db = await openDb();
    await localTag(
        db,
        postRef,
        tag,
        0,
        getTimestamp(),
        false,
        feedUrlB3Base64,
        postIdB3Base64
    );
    try {
        await aunwrap(
            patchPostTags(
                client,
                session,
                userId,
                feedUrlB3Base64,
                postIdB3Base64,
                {
                    untag: [tag],
                }
            )
        );
        await db.postTags.delete([postRef, tag]);
    } catch (e) {
        console.error("untagPostAndSync", "sync error", e);
    }
}

export async function isPostTagged(postRef: number, tag: string) {
    const db = await openDb();
    const tagObject = await db.postTags.get([postRef, tag]);
    return !!tagObject;
}

export async function resetTags() {
    const db = await openDb();
    await db.postTags.clear();
}
