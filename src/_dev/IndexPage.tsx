import { Link } from "@solidjs/router";
import Typography from "@suid/material/Typography";
import { Component } from "solid-js";

const IndexPage: Component = () => {
    return (
        <>
            <Typography variant="h6">Developer Pages</Typography>
            <ul>
                <li>OAuth 2 Playground (removed)</li>
                <li>
                    <Link href="/_dev/session">Current Session</Link>
                </li>
                <li>
                    <Link href="/_dev/euid">EUId Playground</Link>
                </li>
                <li>
                    <Link href="/_dev/tags">Tags</Link>
                </li>
                <li>
                    <Link href="/_dev/feedlists">Feed Lists</Link>
                </li>
            </ul>
        </>
    );
};

export default IndexPage;
