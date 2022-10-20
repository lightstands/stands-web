// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { createMediaQuery } from "@solid-primitives/media";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import Card from "@suid/material/Card";
import CardActions from "@suid/material/CardActions";
import CardContent from "@suid/material/CardContent";
import CardHeader from "@suid/material/CardHeader";
import TextField from "@suid/material/TextField";
import Typography from "@suid/material/Typography";
import {
    batch,
    Component,
    createEffect,
    createSignal,
    Show,
    untrack,
} from "solid-js";
import Style from "./signin.module.css";
import { useStore } from "@nanostores/solid";
import {
    currentSessionStore,
    refresh as refreshSession,
} from "../stores/session";
import {
    isRight,
    newSessionByPassword,
    NotFoundError,
    unboxLeft,
    unboxRight,
    UserAgent,
} from "lightstands-js";
import { useClient } from "../client";
import { Params, useNavigate, useSearchParams } from "@solidjs/router";
import { deviceIdStore } from "../stores/device";
import browserDetect from "browser-detect";
import TechInfoDialog from "../common/TechInfoDlg";
import Link from "@suid/material/Link";
import { error2explain } from "../common/utils";

const DEFAULT_SCOPE =
    "session.list session.revoke_other user.change_password user.create_session user.read feedlist.read feedlist.write feedlist.list";

function getUserAgent() {
    const browser = browserDetect();
    const name = typeof browser.name !== "undefined" ? browser.name : "Browser";
    const mobile =
        typeof browser.mobile !== "undefined"
            ? browser.mobile
                ? " Mobile"
                : ""
            : "";
    const sys = typeof browser.os !== "undefined" ? browser.os : "Unknown OS";
    return {
        p: "web",
        dev: `${name}${mobile} on ${sys}`,
    } as UserAgent;
}

interface LoginPageSearchParams extends Params {
    back: string;
}

const LoginPage: Component = () => {
    const currentSession = useStore(currentSessionStore);
    const deviceId = useStore(deviceIdStore);
    const client = useClient();
    const [username, setUsername] = createSignal("");
    const [password, setPassword] = createSignal("");
    const isMidSmallerScreen = createMediaQuery("screen and (width < 600px)");
    const [signInProgress, setSignInProgress] = createSignal(false);
    const navigate = useNavigate();
    const [params] = useSearchParams<LoginPageSearchParams>();
    const [techInfoDlg, setTechInfoDlg] = createSignal<string>();
    const [unknownError, setUnknownError] = createSignal<Error | undefined>();
    const [knownError, setKnownError] = createSignal<"usernotfound">();

    const signIn = async () => {
        batch(() => {
            setUnknownError(undefined);
            setKnownError(undefined);
            setSignInProgress(true);
        });
        try {
            const ua = getUserAgent();
            const result = await newSessionByPassword(
                client,
                username(),
                password(),
                DEFAULT_SCOPE,
                deviceId(),
                ua
            );
            if (isRight(result)) {
                const info = unboxRight(result);
                currentSessionStore.set({ session: info });
                await refreshSession(client);
            } else {
                const fail = unboxLeft(result);
                if (fail instanceof NotFoundError) {
                    setKnownError("usernotfound");
                }
            }
        } catch (e) {
            if (e instanceof Error) {
                setUnknownError(e);
            } else {
                console.log("unknown instance of error", e);
            }
        } finally {
            setSignInProgress(false);
        }
    };

    createEffect(() => {
        const session = currentSession();
        if (typeof session !== "undefined") {
            if (params.back) {
                navigate(decodeURIComponent(params.back));
            } else {
                navigate("/");
            }
        }
    });

    const getKnownErrorHelperText = () => {
        const errId = knownError();
        if (errId === "usernotfound") {
            return "Please check your password. We could not found the user on LightStands.";
        }
    };

    return (
        <>
            <TechInfoDialog
                open={typeof techInfoDlg() !== "undefined"}
                onClose={() => setTechInfoDlg(undefined)}
                value={techInfoDlg()}
            ></TechInfoDialog>
            <Box class={Style.SmartDialog}>
                <Card
                    elevation={isMidSmallerScreen() ? 0 : 1}
                    class={Style.ComfortHeader}
                >
                    <CardHeader
                        title="Sign in"
                        subheader={
                            <Typography>
                                Use your LightStands account
                            </Typography>
                        }
                    />
                    <CardContent
                        component="form"
                        sx={{ display: "flex", flexDirection: "column" }}
                    >
                        <TextField
                            variant="standard"
                            id="username-or-email-address"
                            label="Username"
                            required
                            autoFocus={true}
                            fullWidth={true}
                            autoComplete="username"
                            value={username()}
                            onChange={(el) => setUsername(el.target.value)}
                            sx={{ marginBottom: "16px" }}
                            error={typeof knownError() !== "undefined"}
                        />
                        <TextField
                            variant="standard"
                            id="password"
                            label="Password"
                            type="password"
                            required
                            fullWidth={true}
                            autoComplete="current-password"
                            value={password()}
                            onChange={(el) => setPassword(el.target.value)}
                            error={typeof knownError() !== "undefined"}
                            helperText={getKnownErrorHelperText()}
                        />
                        <Show when={unknownError()}>
                            <Typography color="error">
                                We have problem while processing your request.{" "}
                                <Link
                                    onClick={() =>
                                        untrack(() =>
                                            setTechInfoDlg(
                                                unknownError()
                                                    ? error2explain(
                                                          unknownError()!
                                                      )
                                                    : undefined
                                            )
                                        )
                                    }
                                    sx={{ cursor: "pointer" }}
                                >
                                    Technical Information...
                                </Link>
                            </Typography>
                        </Show>
                    </CardContent>
                    <CardActions
                        sx={{
                            display: "flex",
                            marginTop: "20px",
                            marginX: "16px",
                            marginBottom: "25px",
                            flexWrap: "wrap-reverse",
                        }}
                    >
                        <Box
                            sx={{
                                display: "inline-flex",
                                justifyContent: "start",
                                flexGrow: 1,
                            }}
                        >
                            <Button disabled>Create account</Button>
                        </Box>
                        <Box
                            sx={{
                                display: "inline-flex",
                                justifyContent: "end",
                                flexGrow: 1,
                            }}
                        >
                            <Button
                                variant="contained"
                                disableElevation
                                disabled={
                                    username().length == 0 ||
                                    password().length == 0 ||
                                    signInProgress()
                                }
                                onClick={signIn}
                            >
                                Sign In
                            </Button>
                        </Box>
                    </CardActions>
                </Card>
            </Box>
        </>
    );
};

export default LoginPage;
