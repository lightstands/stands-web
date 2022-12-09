import {
    getFeedList,
    getAllFeedLists,
    ClientConfig,
    newFeedList as newRemoteFeedList,
    SessionAccess,
    Fork,
    InsufficientStorageError,
    FeedListDetail,
    UnauthorizedError,
    PaymentRequiredError,
    isRight,
    unboxRight,
    Right,
    aunwrap,
    patchFeedList,
    FeedListMetadata,
    randeuid,
} from "lightstands-js";
import { MyDatabase, openDb } from "./db";

async function updateLocalFeedList(
    listid: number,
    includes?: Iterable<[string, number]>,
    excludes?: Iterable<number>,
    tags?: Iterable<string>,
    name?: Iterable<string>
) {
    const db = await openDb();
    db.transaction("rw", db.feedlists, async () => {
        const oldListObject = await db.feedlists.get(listid);
        if (!oldListObject) {
            throw new Error("updating removed feed lists");
        }
        const excludeItems = excludes
            ? [...oldListObject.excludes, ...excludes]
            : oldListObject.excludes;
        const newListObject = {
            listid: oldListObject.listid,
            ownerid: oldListObject.ownerid,
            includes: (includes
                ? [...oldListObject.includes, ...includes]
                : oldListObject.includes
            ).filter(([_feed, id]) => !excludeItems.includes(id)),
            excludes: excludeItems,
            tags: tags || oldListObject.tags,
            name: name || oldListObject.name,
        };
        await db.feedlists.update(listid, newListObject);
    });
}

async function newLocalFeedList(
    listid: number,
    ownerid: number,
    includes: [string, number][],
    excludes: number[],
    tags: string[],
    name: string
) {
    const db = await openDb();
    await db.feedlists.add({
        listid: listid,
        ownerid: ownerid,
        includes,
        excludes,
        tags,
        name,
    });
}

export async function newFeedList(
    client: ClientConfig,
    session: SessionAccess,
    name: string
): Fork<
    InsufficientStorageError | UnauthorizedError | PaymentRequiredError,
    FeedListDetail
> {
    const result = await newRemoteFeedList(client, session, name);
    if (isRight(result)) {
        const meta = unboxRight(result);
        await newLocalFeedList(meta.id, meta.ownerId, [], [], [], name);
        return Right(meta);
    } else {
        return result;
    }
}

export async function getAllLocalFeedLists(db: MyDatabase) {
    return await db.feedlists.toArray();
}

function arrayEql(a0: readonly unknown[], a1: readonly unknown[]) {
    if (a0.length !== a1.length) {
        return false;
    } else {
        for (let i = 0; i < a0.length; i++) {
            if (a0[i] !== a1[i]) {
                return false;
            }
        }
        return true;
    }
}

interface FeedList {
    listid: number;
    ownerid: number;
    includes: [string, number][];
    excludes: number[];
    tags: string[];
}

async function syncSingleList(
    client: ClientConfig,
    session: SessionAccess,
    remoteListIdMap: Map<number, FeedListMetadata>,
    el: FeedList
) {
    const includeIdSet = new Set(el.includes.map(([_feed, id]) => id));
    const remote = remoteListIdMap.get(el.listid);
    if (remote) {
        const remoteList = await aunwrap(
            getFeedList(client, session, el.listid)
        );

        const remoteIncludeIdSet = new Set(
            remoteList.in.map((item) => item.euid)
        );

        const remoteUpdatedExcludes = remoteList.rm.filter(
            (item) => !el.excludes.includes(item)
        );

        const localUpdatedIncludes = el.includes.filter(
            ([_feed, id]) => !remoteIncludeIdSet.has(id)
        );

        const localUpdatedExcludes = el.excludes.filter(
            (id) => !remoteList.rm.includes(id)
        );

        const remoteUpdatedIncludes = remoteList.in
            .filter(
                (item) =>
                    !includeIdSet.has(item.euid) &&
                    !localUpdatedExcludes.includes(item.euid) // Manually exclude remote item which have been excluded in local
            )
            .map(({ feedUrlHash, euid }): [string, number] => [
                feedUrlHash,
                euid,
            ]);

        // Apply patches
        await updateLocalFeedList(
            el.listid,
            remoteUpdatedIncludes,
            remoteUpdatedExcludes
        );
        if (!arrayEql(remote.tags, el.tags)) {
            await updateLocalFeedList(
                el.listid,
                undefined,
                undefined,
                remote.tags
            );
        }
        await aunwrap(
            patchFeedList(client, session, el.listid, {
                in: localUpdatedIncludes.map(([hash, id]) => ({
                    feedUrlHash: hash,
                    euid: id,
                })),
                rm: localUpdatedExcludes,
            })
        );
    }
}

export async function syncAllFeedLists(
    client: ClientConfig,
    session: SessionAccess
) {
    const db = await openDb();
    const allListMetas = Array.from(
        await aunwrap(getAllFeedLists(client, session))
    );
    const remoteListIdMap = new Map(allListMetas.map((v) => [v.id, v]));
    // Remove lists which don't exists on remote
    const localLists = await getAllLocalFeedLists(db);
    const removedLists = localLists.filter(
        ({ listid }) => !remoteListIdMap.has(listid)
    );
    await db.feedlists.bulkDelete(removedLists.map((el) => el.listid));
    // Add new lists on remote
    const localListIdSet = new Set(localLists.map((v) => v.listid));
    const addedLists = allListMetas.filter((el) => !localListIdSet.has(el.id));
    for (const meta of addedLists) {
        await newLocalFeedList(
            meta.id,
            meta.ownerId,
            [],
            [],
            meta.tags.concat(),
            ""
        );
    }
    // Apply new tags
    for (const el of localLists) {
        const remote = remoteListIdMap.get(el.listid);
        if (remote && !arrayEql(remote.tags, el.tags)) {
            await updateLocalFeedList(
                el.listid,
                undefined,
                undefined,
                remote.tags
            );
        }
    }
    // Update list content
    await Promise.all(
        localLists.map((el) =>
            syncSingleList(client, session, remoteListIdMap, el).then(
                () => ({
                    status: "success",
                    listid: el.listid,
                    reason: undefined,
                }),
                (reason) => ({
                    status: "failed",
                    listid: el.listid,
                    reason: reason,
                })
            )
        )
    );
}

export async function getDefaultFeedList() {
    const db = await openDb();
    const result = await db.feedlists
        .filter((o) => o.tags.includes("_default"))
        .toArray();
    if (result.length > 0) {
        return result[0];
    } else {
        return undefined;
    }
}

export async function getFeedListById(listid: number) {
    const db = await openDb();
    return await db.feedlists.get(listid);
}

export async function resetFeedLists() {
    const db = await openDb();
    await db.feedlists.clear();
}

export async function removeFeedFromList(
    client: ClientConfig,
    session: SessionAccess,
    listid: number,
    euid: number
): Promise<boolean> {
    const db = await openDb();
    await db.transaction("rw", db.feedlists, async () => {
        const list = await db.feedlists.get(listid);
        if (list) {
            list.includes = list.includes.filter(([_feed, id]) => id !== euid);
            list.excludes.push(euid);
            await db.feedlists.put(list);
        }
    });
    try {
        await aunwrap(
            // Beat-effort patching
            patchFeedList(client, session, listid, {
                rm: [euid],
            })
        );
    } catch {
        return false;
    }
    return true;
}

export async function addFeedToList(
    client: ClientConfig,
    session: SessionAccess,
    listid: number,
    feedUrlBlake3Base64: string
) {
    const pair: [string, number] = [feedUrlBlake3Base64, randeuid()];
    updateLocalFeedList(listid, [pair]);
    try {
        await aunwrap(
            patchFeedList(client, session, listid, {
                in: [{ feedUrlHash: pair[0], euid: pair[1] }],
            })
        );
    } catch {}
    return pair;
}
