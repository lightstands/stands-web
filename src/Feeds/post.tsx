import { useParams } from "@solidjs/router";
import Modal from "@suid/material/Modal";
import { Component } from "solid-js";
import { useSync } from "../common/synmgr";
import PostInner from "./PostInner";

const PostSheet: Component = () => {
    useSync(["tags"]);
    const args = useParams<{ feed: string; post: string }>();
    return (
        <Modal open={true}>
            <PostInner feedUrlBlake3={args.feed} postIdBlake3={args.post} />
        </Modal>
    );
};

export default PostSheet;
