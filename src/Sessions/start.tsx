import { makeAuthCodeFlowUrl } from "lightstands-js";
import { Component, onMount } from "solid-js";
import { Params } from "@solidjs/router";

import { newCodeVerifier, commitCodeVerifier } from "../stores/code-verifier";
import { useSession } from "../stores/session";
import { useClient } from "../client";
import { useNavigate, useSearchParams } from "../common/nav";

const SCOPE = [
    "user.read",
    "feedlist.read",
    "feedlist.write",
    "feedlist.list",
    "feedlist.new",
    "feedlist.rm",
    "tags.read",
    "tags.write",
];

const SCOPE_STRING = SCOPE.join(" ");

function setEq<T>(s0: Set<T>, s1: Set<T>) {
    if (s0.size === s1.size) {
        return true;
    } else {
        for (const item of s0) {
            if (!s1.has(item)) {
                return false;
            }
        }
        return true;
    }
}

interface StartOAuth2PageQueries extends Params {
    readonly back: string;
}

const StartOAuth2Page: Component = () => {
    const client = useClient();
    const [searchParams] = useSearchParams<StartOAuth2PageQueries>();
    const currentSession = useSession();
    const navigate = useNavigate();

    const redirectUri = () => {
        return new URL("./oauth2-callback", window.location.toString());
    };

    const authCodeFlowUrl = (codeVerifier: string) => {
        const session = currentSession();
        return makeAuthCodeFlowUrl(client, {
            redirect_uri: redirectUri().toString(),
            scope: SCOPE_STRING,
            code_verifier: codeVerifier,
            code_challenge_method: "s256",
            state: searchParams.back,
            ref_tok: session?.session.accessTokenObject.refreshToken,
        });
    };

    const startAuth = async () => {
        const cv = newCodeVerifier();
        commitCodeVerifier(cv);
        const url = await authCodeFlowUrl(cv);
        window.location.assign(url);
    };

    const isAuthRequired = () => {
        const session = currentSession();
        if (session) {
            const tokObj = session.session.accessTokenObject;
            const requestedScope = new Set(SCOPE);
            const oldScope = new Set(tokObj.scope.split(" "));
            if (setEq(requestedScope, oldScope)) {
                return false;
            }
        }
        return true;
    };

    onMount(() => {
        if (isAuthRequired()) {
            startAuth();
        } else {
            navigate(searchParams.back || "/", {
                replace: true,
            });
        }
    });

    return <></>;
};

export default StartOAuth2Page;
