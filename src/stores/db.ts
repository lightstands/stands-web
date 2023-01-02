/* @refresh reload */
import Dexie from "dexie";
import { PublicFeed, PublicPost } from "lightstands-js";
import { synchronised } from "../common/locks";

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

type FeedMeta = PublicFeed & {
    lastUsedAt: number; // Note: limit the write into day-basis
};

type PostMeta = PublicPost & {
    fetchedAt: number;
};

export class MyDatabase extends Dexie {
    postTags!: Dexie.Table<PostTags, [number, string]>;
    feedlists!: Dexie.Table<FeedList, number>;
    feedmetas!: Dexie.Table<FeedMeta, number>;
    postmetas!: Dexie.Table<PostMeta, number>;

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
        this.version(5).stores({
            postmetas: "ref, [feedRef+idBlake3], publishedAt",
        });
    }
}

let gDbRef: MyDatabase | null = null;

export async function openDb(): Promise<MyDatabase> {
    if (gDbRef !== null) {
        return gDbRef;
    } else {
        await synchronised("open-db", async () => {
            if (gDbRef === null) {
                gDbRef = (await new MyDatabase().open()) as MyDatabase;
            }
        });
        return gDbRef as unknown as MyDatabase;
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
