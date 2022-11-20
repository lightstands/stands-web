import { Link } from "@solidjs/router";
import Typography from "@suid/material/Typography";
import { Component } from "solid-js";

const IndexPage: Component = () => {
    return (
        <>
            <Typography variant="h6">Developer Pages</Typography>
            <ul>
                <li>
                    <Link href="/_dev/oauth2">OAuth 2 Playground</Link>
                </li>
                <li>
                    <Link href="/_dev/session">Current Session</Link>
                </li>
                <li>
                    <Link href="/_dev/euid">EUId Playground</Link>
                </li>
                <li>
                    <Link href="/_dev/tags">Tags</Link>
                </li>
            </ul>
        </>
    );
};

export default IndexPage;
