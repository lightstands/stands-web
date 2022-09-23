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
import { Component, Match, Show, Switch } from "solid-js";
import { currentSessionStore } from "../stores/session";
import CommonStyle from "./common.module.css";

const CurrentSessionPage: Component = () => {
    const currentSession = useStore(currentSessionStore);
    const navigate = useNavigate();

    const goSignOut = () => {
        const path = window.location.pathname;
        navigate(`/sign-out?back=${encodeURIComponent(path)}`);
    };

    const goSignIn = () => {
        const path = window.location.pathname;
        navigate(`/sign-in?back=${encodeURIComponent(path)}`);
    };
    return (
        <>
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
                        left: "50%",
                        transform: "translateX(-50%)",
                        position: "relative",
                        marginTop: "24px",
                    }}
                    class={CommonStyle.SmartFullMaxWidth}
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
                    </Box>
                </Card>
            </Box>
        </>
    );
};

export default CurrentSessionPage;
