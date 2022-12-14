// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
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
import TechInfoDialog from "../common/TechInfoDlg";
import Link from "@suid/material/Link";
import { error2explain } from "../common/utils";
import CenterCard from "../common/CenterCard";
import { UAParser } from "ua-parser-js";

const DEFAULT_SCOPE = [
    "session.list",
    "session.revoke_other",
    "user.change_password",
    "user.create_session",
    "user.read",
    "feedlist.read",
    "feedlist.write",
    "feedlist.list",
    "feedlist.new",
    "feedlist.rm",
    "tags.read",
    "tags.write",
].join(" ");

function getUserAgent() {
    const ua = UAParser();
    const name =
        typeof ua.browser.name !== "undefined" ? ua.browser.name : "Browser";
    const sys = typeof ua.os.name !== "undefined" ? ua.os.name : "Unknown OS";
    return {
        p: "web",
        dev: `${name} on ${sys}`,
    } as UserAgent;
}

interface LoginPageSearchParams extends Params {
    back: string;
}

const LoginPage: Component = () => {
    const [searchParams] = useSearchParams<{ username: string }>();
    const currentSession = useStore(currentSessionStore);
    const deviceId = useStore(deviceIdStore);
    const client = useClient();
    const [username, setUsername] = createSignal(
        searchParams.username ? searchParams.username : ""
    );
    const [password, setPassword] = createSignal("");
    const [signInProgress, setSignInProgress] = createSignal(false);
    const navigate = useNavigate();
    const [params] = useSearchParams<LoginPageSearchParams>();
    const [techInfoDlg, setTechInfoDlg] = createSignal<string>();
    const [unknownError, setUnknownError] = createSignal<Error | undefined>();
    const [knownError, setKnownError] = createSignal<"usernotfound">();

    const signIn = async () => {
        if (signInProgress()) return;
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

    const onTextFieldKeyDown = (ev: KeyboardEvent) => {
        if (ev.code == "Enter") {
            signIn();
        }
    };

    return (
        <>
            <TechInfoDialog
                open={typeof techInfoDlg() !== "undefined"}
                onClose={() => setTechInfoDlg(undefined)}
                value={techInfoDlg()}
            ></TechInfoDialog>
            <CenterCard>
                <CardHeader
                    title="Sign in"
                    subheader={
                        <Typography>Use your LightStands account</Typography>
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
                        onKeyDown={onTextFieldKeyDown}
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
                        onKeyDown={onTextFieldKeyDown}
                    />
                    <Show when={unknownError()}>
                        <Typography color="error">
                            We have problem while processing your request.{" "}
                            <Link
                                onClick={() =>
                                    untrack(() =>
                                        setTechInfoDlg(
                                            unknownError()
                                                ? error2explain(unknownError()!)
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
                        <Button onClick={() => navigate("/sign-up/")}>
                            Create account
                        </Button>
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
            </CenterCard>
        </>
    );
};

export default LoginPage;
