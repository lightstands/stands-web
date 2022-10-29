// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { useStore } from "@nanostores/solid";
import { useNavigate } from "@solidjs/router";
import AppBar from "@suid/material/AppBar";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import Card from "@suid/material/Card";
import Toolbar from "@suid/material/Toolbar";
import Typography from "@suid/material/Typography";
import { aunwrap, getAllFeedLists, newFeedList } from "lightstands-js";
import { Component, createResource, createSignal, Show } from "solid-js";
import { useClient } from "../client";
import TechInfoDialog from "../common/TechInfoDlg";
import { currentSessionStore } from "../stores/session";
import CommonStyle from "./common.module.css";

const CurrentSessionPage: Component = () => {
    const client = useClient();
    const currentSession = useStore(currentSessionStore);
    const navigate = useNavigate();
    const [technicalError, setTechnicalError] = createSignal<string>();

    const [defaultListMeta, defaultListMetaCtl] = createResource(
        currentSession,
        async (session) => {
            const lists = await aunwrap(
                getAllFeedLists(client, session.session)
            );
            for (const l of lists) {
                if (l.tags.includes("_default")) {
                    return l;
                }
            }
        }
    );

    const goSignOut = () => {
        const path = window.location.pathname;
        navigate(`/sign-out?back=${encodeURIComponent(path)}`);
    };

    const goSignIn = () => {
        const path = window.location.pathname;
        navigate(`/sign-in?back=${encodeURIComponent(path)}`);
    };

    const setupDefaultFeedList = async () => {
        try {
            await aunwrap(
                newFeedList(client, currentSession()!.session, "", {
                    tags: ["_default"],
                })
            );
            defaultListMetaCtl.refetch();
        } catch (e) {
            if (e instanceof Error) {
                setTechnicalError(e.toString());
            } else {
                console.log(e);
            }
        }
    };

    return (
        <>
            <TechInfoDialog
                open={!!technicalError()}
                value={technicalError()}
                onClose={() => setTechnicalError()}
            />
            <Box>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Current Session
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Card
                    sx={{
                        marginTop: "24px",
                    }}
                    class={`${CommonStyle.SmartFullMaxWidth} ${CommonStyle.ViewpointXCenter}`}
                >
                    <Box
                        sx={{
                            marginTop: "8px",
                            marginX: "24px",
                            marginBottom: "24px",
                            flexDirection: "row",
                        }}
                    >
                        <Typography variant="h6">Current Session</Typography>
                        <Show when={currentSession()}>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexFlow: "wrap",
                                }}
                            >
                                <Typography>Access Token: </Typography>

                                <code
                                    style={{
                                        "line-height": 1.5,
                                        "margin-inline-start": "4px",
                                        overflow: "scroll",
                                    }}
                                >
                                    {currentSession()!.session.accessToken}
                                </code>
                            </Box>
                            <Box>
                                <code
                                    style={{
                                        "line-height": 1.5,
                                        display: "block",
                                        margin: "20px",
                                        "white-space": "pre",
                                        overflow: "scroll",
                                    }}
                                >
                                    {JSON.stringify(
                                        currentSession()!.account,
                                        undefined,
                                        2
                                    )}
                                </code>
                            </Box>
                            <Box>
                                <code
                                    style={{
                                        "line-height": 1.5,
                                        display: "block",
                                        margin: "20px",
                                        "white-space": "pre",
                                        overflow: "scroll",
                                    }}
                                >
                                    {JSON.stringify(
                                        currentSession()!.session
                                            .accessTokenObject,
                                        undefined,
                                        2
                                    )}
                                </code>
                            </Box>
                        </Show>
                        <Box sx={{ display: "flex", justifyContent: "end" }}>
                            <Show
                                when={typeof currentSession() === "undefined"}
                                fallback={
                                    <Button onClick={goSignOut}>
                                        Sign out...
                                    </Button>
                                }
                            >
                                <Button onClick={goSignIn}>Sign in...</Button>
                            </Show>
                        </Box>
                        <Box>
                            <Typography variant="h6">
                                Default Feed List
                            </Typography>
                            <Show
                                when={defaultListMeta.state === "ready"}
                                fallback={<Typography>Fetching</Typography>}
                            >
                                <Typography>
                                    List ID: {defaultListMeta()?.id?.toString()}
                                </Typography>
                                <Typography>
                                    Tags: {defaultListMeta()?.tags?.join(", ")}
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "end",
                                    }}
                                >
                                    <Show
                                        when={
                                            typeof currentSession() !==
                                                "undefined" &&
                                            typeof defaultListMeta() ===
                                                "undefined"
                                        }
                                    >
                                        <Button onClick={setupDefaultFeedList}>
                                            Setup Default Feed List
                                        </Button>
                                    </Show>
                                </Box>
                            </Show>
                        </Box>
                    </Box>
                </Card>
            </Box>
        </>
    );
};

export default CurrentSessionPage;
