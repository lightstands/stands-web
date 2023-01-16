import { useParams } from "@solidjs/router";
import { Component } from "solid-js";
import { useSync } from "../common/synmgr";

import PostInner from "./PostInner";

const PostPage: Component = () => {
    useSync();
    const args = useParams<{ feed: string; post: string }>();
    return <PostInner feedUrlBlake3={args.feed} postIdBlake3={args.post} />;
};

export default PostPage;
