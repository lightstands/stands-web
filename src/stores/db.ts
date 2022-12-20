import Dexie from "dexie";

interface PostTags {
    post_ref: number;
    tag: string;
    created_at: number;
    updated_at: number;
    data?: string;
    // two fields below are for sync tags
    feed_url_blake3_base64?: string;
    post_id_blake3_base64?: string;
    // mark of is the tag is sync to remote, 0 = false, other (1) = true
    is_sync: number;
}

interface FeedList {
    listid: number;
    ownerid: number;
    includes: [string, number][];
    excludes: number[];
    tags: string[];
    name: string;
}

interface FeedMeta {
    ref: number;
    url: string;
    urlBlake3: string;
    title?: string;
    link?: string;
    description?: string;
    updatedAt: number;
    lastFetchedAt: number;
    lastUsedAt: number; // Note: limit the write into day-basis
}

export class MyDatabase extends Dexie {
    postTags!: Dexie.Table<PostTags, [number, string]>;
    feedlists!: Dexie.Table<FeedList, number>;
    feedmetas!: Dexie.Table<FeedMeta, number>;

    constructor() {
        super("lightstands4web");
        this.version(1).stores({
            postTags: "[post_ref+tag], updated_at, [tag+is_sync]",
        });
        this.version(2).stores({
            feedlists: "listid",
        });
        this.version(3).stores({
            feedmetas: "ref, urlBlake3",
        });
    }
}

let gDbRef: MyDatabase | null = null;

export async function openDb(): Promise<MyDatabase> {
    if (gDbRef !== null) {
        return gDbRef;
    } else {
        gDbRef = (await new MyDatabase().open()) as MyDatabase;
        return gDbRef;
    }
}

window.addEventListener("pagehide", (ev) => {
    if (ev.persisted) {
        const db = gDbRef;
        if (db !== null) {
            gDbRef = null;
            db.close();
        }
    }
});
