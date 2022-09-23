// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/solid";
import { Params, useSearchParams } from "@solidjs/router";
import { Backspace } from "@suid/icons-material";
import MenuDown from "@suid/icons-material/ArrowDropDown";
import AppBar from "@suid/material/AppBar";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import Card from "@suid/material/Card";
import IconButton from "@suid/material/IconButton";
import SvgIcon from "@suid/material/SvgIcon";
import TextField from "@suid/material/TextField";
import Toolbar from "@suid/material/Toolbar";
import Typography from "@suid/material/Typography";
import {
    aunwrap,
    ClientConfig,
    completeAuthorizationCodeFlow,
    getAuthorizationUrlForAuthorizationCodeFlow,
} from "lightstands-js";
import { action, WritableAtom } from "nanostores";
import { Component, createSignal, onMount, Show, Signal } from "solid-js";
import { untrack } from "solid-js/web";
import MultiDice from "../assets/MultiDice";
import TechInfoDialog from "../common/TechInfoDlg";
import CommonStyle from "./common.module.css";

const clientIdStore = persistentAtom<string>("stands-web._dev.client-id", "");
const clientSecretStore = persistentAtom<string>(
    "stands-web._dev.client-secret",
    ""
);
const clientScopeStore = persistentAtom<string>(
    "stands-web._dev.client-scope",
    ""
);
const clientEndpointStore = persistentAtom<string>(
    "stands-web._dev.client-endpoint",
    "https://api.lightstands.xyz/moutsea/"
);
const clientRedirectUrlStore = persistentAtom<string>(
    "stands-web._dev.client-redirect-url",
    ""
);
const codeVerifierStore = persistentAtom<string>(
    "stands-web._dev.code-verifier",
    ""
);
const userAgentIdStore = persistentAtom<string>(
    "stands-web._dev.user-agent-id",
    ""
);
const currentAccessTokenStore = persistentAtom<
    { token: string; refreshToken: string } | undefined
>("stands-web._dev.access-token", undefined, {
    decode: (s): { token: string; refreshToken: string } | undefined => {
        if (s === "") {
            return undefined;
        }
        let result = JSON.parse(s);
        if (typeof result === "object") {
            return result;
        } else {
            return undefined;
        }
    },
    encode: (session) => {
        if (typeof session === "undefined") {
            return "";
        } else {
            return JSON.stringify(session);
        }
    },
});

type StoreSaver<T> = () => T;

function useStoreCached<T>(
    atom: WritableAtom<T>,
    initial: T
): [...Signal<T>, StoreSaver<T>] {
    const [get, set] = createSignal<T>(initial);

    onMount(() => {
        set(() => atom.get());
    });

    const saver = () => {
        return untrack(() => {
            const val = get();
            atom.set(val);
            return val;
        });
    };

    return [get, set, saver];
}

interface OAuth2CallbackParams extends Params {
    code: string;
    state: string;
    error: string;
    error_description: string;
    error_uri: string;
}

const ClientConfiguration: Component = () => {
    const [clientId, setClientId, saveClientId] = useStoreCached(
        clientIdStore,
        ""
    );
    const [clientSecret, setClientSecret, saveClientSecret] = useStoreCached(
        clientSecretStore,
        ""
    );
    const [clientScope, setClientScope, saveClientScope] = useStoreCached(
        clientScopeStore,
        ""
    );
    const [clientEndpoint, setClientEndpoint, saveClientEndpoint] =
        useStoreCached(clientEndpointStore, "https://example.org");
    const [clientRedirectUrl, setClientRedirectUrl, saveClientRedirectUrl] =
        useStoreCached(clientRedirectUrlStore, "");

    const saveClientConfig = () => {
        saveClientId();
        saveClientSecret();
        saveClientScope();
        saveClientEndpoint();
        saveClientRedirectUrl();
    };

    onMount(() => {
        if (!clientRedirectUrl()) {
            setClientRedirectUrl(window.location.toString());
        }
    });
    return (
        <>
            <Box>
                <Typography variant="h6">Client Configuration</Typography>
                <TextField
                    variant="standard"
                    label="API Endpoint"
                    value={clientEndpoint()}
                    onChange={(e) => setClientEndpoint(e.target.value)}
                    fullWidth={true}
                />
                <TextField
                    variant="standard"
                    label="Client Id"
                    value={clientId()}
                    onChange={(e) => setClientId(e.target.value)}
                    fullWidth={true}
                />
                <TextField
                    variant="standard"
                    label="Client Secret"
                    value={clientSecret()}
                    onChange={(e) => setClientSecret(e.target.value)}
                    fullWidth={true}
                />
                <TextField
                    variant="standard"
                    label="Client Scope"
                    value={clientScope()}
                    onChange={(e) => setClientScope(e.target.value)}
                    fullWidth={true}
                />
                <TextField
                    variant="standard"
                    label="Client Redirect URL"
                    value={clientRedirectUrl()}
                    onChange={(e) => setClientRedirectUrl(e.target.value)}
                    fullWidth={true}
                />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "end",
                    margin: "8px",
                }}
            >
                <Button
                    variant="contained"
                    disableElevation
                    onClick={saveClientConfig}
                >
                    Save
                </Button>
            </Box>
        </>
    );
};

const OAuth2TestPage: Component = () => {
    const clientId = useStore(clientIdStore);
    const clientSecret = useStore(clientSecretStore);
    const clientScope = useStore(clientScopeStore);
    const clientEndpoint = useStore(clientEndpointStore);
    const clientRedirectUrl = useStore(clientRedirectUrlStore);

    const [codeVerifier, setCodeVerifier, saveCodeVerifier] = useStoreCached(
        codeVerifierStore,
        ""
    );
    const [userAgentId, setUserAgentId, saveUserAgentId] = useStoreCached(
        userAgentIdStore,
        ""
    );
    const [params, setParams] = useSearchParams<OAuth2CallbackParams>();
    const currentAccessToken = useStore(currentAccessTokenStore);
    const [exgAuthCodeErr, setExgAuthCodeErr] = createSignal<Error>();
    const [techInfoDlg, setTechInfoDlg] = createSignal<string>();

    const makeClientConfig = (): ClientConfig => {
        return {
            clientId: clientId(),
            clientSecret: clientSecret() ? clientSecret() : null,
            endpointBase: clientEndpoint(),
        };
    };

    const codeFlowAuthorizationURL = () => {
        return getAuthorizationUrlForAuthorizationCodeFlow(makeClientConfig(), {
            scope: clientScope(),
            code_verifier: codeVerifier(),
            redirect_uri: clientRedirectUrl(),
            ua_id: userAgentId() ? userAgentId() : undefined,
        });
    };

    const codeFlowAuthURLPresentation = () => {
        try {
            return codeFlowAuthorizationURL().toString();
        } catch {
            return "";
        }
    };
    const supportsCrypto = () => typeof crypto !== "undefined";
    const setRandomCodeVerifier = () => {
        setCodeVerifier(crypto.randomUUID());
    };

    const setRandomUserAgentId = () => {
        setUserAgentId(crypto.randomUUID());
    };

    const requestAuthCodeFlow = () => {
        const nextJump = codeFlowAuthorizationURL();
        saveCodeVerifier();
        saveUserAgentId();

        window.location.assign(nextJump);
    };

    const exchangeAuthCode = async () => {
        const code = params.code;

        try {
            const result = await aunwrap(
                completeAuthorizationCodeFlow(
                    makeClientConfig(),
                    clientRedirectUrl(),
                    codeVerifier(),
                    code
                )
            );
            currentAccessTokenStore.set({
                token: result.accessToken,
                refreshToken: result.accessTokenObject.refreshToken,
            });
            setCodeVerifier("");
            saveCodeVerifier();
            setRandomCodeVerifier();
        } catch (e) {
            if (e instanceof Error) {
                setExgAuthCodeErr(e);
            } else {
                console.log("unknown catchable", e);
            }
        }
    };

    const resetToken = action(
        currentAccessTokenStore,
        "resetToken",
        (store) => {
            store.set(undefined);
        }
    );

    onMount(() => {
        if (!userAgentId()) {
            setRandomUserAgentId();
        }
        if (!codeVerifier()) {
            setRandomCodeVerifier();
        }
    });
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        OAuth 2.0 Playground
                    </Typography>
                </Toolbar>
            </AppBar>
            <TechInfoDialog
                open={!!techInfoDlg()}
                value={techInfoDlg()}
                onClose={() => setTechInfoDlg(undefined)}
            />
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
                    }}
                >
                    <Typography sx={{ margin: "8px" }}>
                        This playground is intended to test OAuth 2.0
                        confirmation.
                    </Typography>
                    <Box>
                        <Typography variant="h6">New application</Typography>
                        <code
                            style={{
                                display: "block",
                                margin: "20px",
                            }}
                        >
                            ls-userctl new-app --redirect '{clientRedirectUrl()}
                            ' "TestApp" '{clientScope()}'
                        </code>
                    </Box>
                    <ClientConfiguration />
                    <Box>
                        <Typography variant="h6">
                            Authorization Code Flow
                            <IconButton>
                                <MenuDown />
                            </IconButton>
                        </Typography>
                        <Box sx={{ display: "flex" }}>
                            <TextField
                                label="Code Verifier"
                                variant="standard"
                                value={codeVerifier()}
                                onChange={(e) =>
                                    setCodeVerifier(e.target.value)
                                }
                                sx={{ flexGrow: 1 }}
                            ></TextField>
                            <Show when={supportsCrypto()}>
                                <IconButton onClick={setRandomCodeVerifier}>
                                    <MultiDice />
                                </IconButton>
                            </Show>
                        </Box>
                        <Box sx={{ display: "flex" }}>
                            <TextField
                                label="User Agent Id"
                                variant="standard"
                                value={userAgentId()}
                                onChange={(e) => setUserAgentId(e.target.value)}
                                sx={{ flexGrow: 1 }}
                            ></TextField>
                            <Show when={supportsCrypto()}>
                                <IconButton onClick={setRandomUserAgentId}>
                                    <MultiDice />
                                </IconButton>
                            </Show>
                        </Box>
                        <code style={{ display: "block", margin: "20px" }}>
                            {codeFlowAuthURLPresentation()}
                        </code>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "end",
                                margin: "8px",
                            }}
                        >
                            <Button
                                variant="contained"
                                disableElevation
                                disabled={
                                    !Boolean(codeFlowAuthURLPresentation())
                                }
                                onClick={requestAuthCodeFlow}
                            >
                                Save & Request
                            </Button>
                        </Box>
                    </Box>
                    <Box>
                        <Box sx={{ display: "flex" }}>
                            <TextField
                                fullWidth
                                disabled
                                variant="standard"
                                label="Authorization Code"
                                value={params.code || ""}
                                sx={{ flexGrow: 1 }}
                            />
                            <Show when={params.code}>
                                <IconButton
                                    onClick={() =>
                                        setParams({ code: undefined })
                                    }
                                    size="large"
                                >
                                    <Backspace />
                                </IconButton>
                            </Show>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "end",
                                marginY: "16px",
                            }}
                        >
                            <Button
                                variant="contained"
                                disableElevation
                                disabled={!params.code}
                                onClick={exchangeAuthCode}
                            >
                                Request Access Token
                            </Button>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h6">
                            Current Access Token
                        </Typography>
                        <Show
                            when={currentAccessToken()}
                            fallback={
                                <Typography>No current token.</Typography>
                            }
                        >
                            <Box sx={{ display: "flex", flexDirection: "row" }}>
                                <Typography>Access Token:</Typography>
                                <code style={{ "line-height": 1.5 }}>
                                    {currentAccessToken()!.token}
                                </code>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "row" }}>
                                <Typography>Refresh Token:</Typography>
                                <code style={{ "line-height": 1.5 }}>
                                    {currentAccessToken()!.refreshToken}
                                </code>
                            </Box>
                            <Box
                                sx={{ display: "flex", justifyContent: "end" }}
                            >
                                <Button onClick={resetToken}>Reset</Button>
                            </Box>
                        </Show>
                    </Box>
                    <Box sx={{ marginTop: "24px" }}>
                        <Typography variant="h6">Error & State</Typography>
                        <Show
                            when={params.error}
                            fallback={<Typography>No error.</Typography>}
                        >
                            <Typography>Error: {params.error}</Typography>
                            <Typography>
                                Error description: {params.error_description}
                            </Typography>
                            <Typography>
                                Error URI: {params.error_uri}
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "end",
                                    marginTop: "8px",
                                }}
                            >
                                <Button onClick={resetToken}>Reset</Button>
                            </Box>
                        </Show>
                        <Typography>
                            State: {params.state || "undefined"}
                        </Typography>
                    </Box>
                </Box>
            </Card>
            <Box sx={{ height: "64px" }}></Box>
        </>
    );
};

export default OAuth2TestPage;
