// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { useSearchParams } from "@solidjs/router";
import { Box, Typography } from "@suid/material";
import {
    aunwrap,
    completeAuthorizationCodeFlow,
    OAuth2Error,
} from "lightstands-js";
import {
    Component,
    createEffect,
    createSignal,
    Match,
    Show,
    Switch,
} from "solid-js";

import { useClient } from "../client";
import { useNavigate } from "../common/nav";
import { getCodeVerifier } from "../stores/code-verifier";
import { addSession, refresh } from "../stores/session";

type Params = Record<string, string>;

type LSOAuth2CallbackSearchParams = Params & {
    code: string;
    state: string;
};

type LSOAuth2ErrorCallbackSearchParams = Params &
    OAuth2Error & { state?: string };

function isOAuth2Error(o: unknown): o is OAuth2Error {
    if (typeof o === "object" && o !== null) {
        const obj = o as Record<string, unknown>;
        return (
            typeof obj["error"] === "string" &&
            typeof obj["error_description"] === "string"
        );
    }
    return false;
}

const OAuth2Callback: Component = () => {
    const client = useClient();
    const [searchParams] = useSearchParams<
        LSOAuth2CallbackSearchParams | LSOAuth2ErrorCallbackSearchParams
    >();
    const [knownError, setKnownError] = createSignal<{
        name: "oauth2" | "unknown";
        reason?: unknown;
    }>();
    const navigate = useNavigate();

    const currentURI = () => {
        const base = new URL(window.location.toString());
        base.hash = "";
        base.search = "";
        return base;
    };

    const exchSession = async (code: string) => {
        const verifier = getCodeVerifier();
        if (verifier) {
            try {
                const newSession = await aunwrap(
                    completeAuthorizationCodeFlow(
                        client,
                        currentURI().toString(),
                        verifier,
                        code
                    )
                );
                addSession(newSession);
                refresh(client);
            } catch (e) {
                if (isOAuth2Error(e)) {
                    setKnownError({
                        name: "oauth2",
                        reason: e,
                    });
                } else {
                    setKnownError({
                        name: "unknown",
                        reason: e,
                    });
                }
            }
        }
    };

    createEffect(() => {
        if (searchParams.code) {
            const params = searchParams as LSOAuth2CallbackSearchParams;
            exchSession(params.code).then(() => {
                navigate(params.state || "/");
            });
        } else {
            const params = searchParams as LSOAuth2ErrorCallbackSearchParams;
            setKnownError({
                name: "oauth2",
                reason: params,
            });
        }
    });

    const paramsObject = () => {
        if (typeof searchParams.code !== "undefined") {
            const params = searchParams as LSOAuth2CallbackSearchParams;
            return {
                code: params.code,
                state: params.state,
            };
        } else {
            const params = searchParams as LSOAuth2ErrorCallbackSearchParams;
            return {
                error: params.error,
                error_description: params.error_description,
                error_uri: params.error_uri,
                state: params.state,
            };
        }
    };
    return (
        <>
            <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography>Redirecting...</Typography>
                <Typography component="code">
                    {JSON.stringify(paramsObject, undefined, 2)}
                </Typography>
                <Show when={knownError()}>
                    <Switch>
                        <Match when={knownError()?.name === "oauth2"}>
                            <Typography>
                                There's an error during verification. Please try
                                again later. If it's still, please let us know.
                            </Typography>
                            <Typography>
                                {(knownError()!.reason as OAuth2Error).error},{" "}
                                {
                                    (knownError()!.reason as OAuth2Error)
                                        .error_description
                                }
                            </Typography>
                        </Match>
                        <Match when={knownError()!.name === "unknown"}>
                            <Typography>
                                There's an unknown error. Please try again
                                later. If it's still, please let us know.
                            </Typography>
                            <Typography>
                                {String(knownError()!.reason)}
                            </Typography>
                        </Match>
                    </Switch>
                </Show>
            </Box>
        </>
    );
};

export default OAuth2Callback;
