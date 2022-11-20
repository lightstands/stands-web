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

export class MyDatabase extends Dexie {
    postTags!: Dexie.Table<PostTags, [number, string]>;

    constructor() {
        super("lightstands4web");
        this.version(1).stores({
            postTags: "[post_ref+tag], updated_at, [tag+is_sync]",
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
