// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { useNavigate, useSearchParams } from "@solidjs/router";
import Box from "@suid/material/Box";
import Typography from "@suid/material/Typography";
import { Component, createEffect } from "solid-js";

type Params = Record<string, string>;

type LSOAuth2CallbackSearchParams = Params & {
    code: string;
    state: string;
};

type LSOAuth2ErrorCallbackSearchParams = Params & {
    error: string;
    error_description: string;
    error_uri?: string;
    state?: string;
};

const OAuth2Callback: Component = () => {
    const [searchParams] = useSearchParams<
        LSOAuth2CallbackSearchParams | LSOAuth2ErrorCallbackSearchParams
    >();
    const navigate = useNavigate();
    createEffect(() => {
        if (typeof searchParams.code !== "undefined") {
            const params = searchParams as LSOAuth2CallbackSearchParams;
        } else {
            const params = searchParams as LSOAuth2ErrorCallbackSearchParams;
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
            </Box>
        </>
    );
};

export default OAuth2Callback;
