import { useParams } from "@solidjs/router";
import Modal from "@suid/material/Modal";
import { Component } from "solid-js";
import PostInner from "./PostInner";

const PostSheet: Component = () => {
    const args = useParams<{ feed: string; post: string }>();
    return (
        <Modal open={true}>
            <PostInner feedUrlBlake3={args.feed} postIdBlake3={args.post} />
        </Modal>
    );
};

export default PostSheet;
