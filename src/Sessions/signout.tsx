// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { Params, useNavigate, useSearchParams } from "@solidjs/router";
import { Component, onMount } from "solid-js";
import { useClient } from "../client";
import { revokeSession } from "../stores/session";

interface SignOutSearchParams extends Params {
    back: string;
}

const SignOutPage: Component = () => {
    const client = useClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams<SignOutSearchParams>();
    onMount(() => {
        revokeSession(client).then(() => {
            if (searchParams.back) {
                navigate(searchParams.back);
            } else {
                navigate("/");
            }
        });
    });
    return <></>;
};

export default SignOutPage;
