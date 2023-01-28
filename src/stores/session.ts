// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { action } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import {
    ClientConfig,
    getUserPublicInfo,
    isRight,
    PublicUser,
    refreshSession,
    Session,
    unboxLeft,
    unboxRight,
    revokeSession as revokeRemoteSession,
    aunwrap,
} from "lightstands-js";
import { resetData } from "../common/synmgr";
import { useStore } from "@nanostores/solid";

interface SessionStore {
    account?: PublicUser;
    session: Session;
}

function decodeSession(s: string): SessionStore | undefined {
    if (s === "") {
        return undefined;
    }
    let result = JSON.parse(s);
    if (typeof result === "object") {
        return result;
    } else {
        return undefined;
    }
}

function encodeSession(session: SessionStore | undefined): string {
    if (typeof session === "undefined") {
        return "";
    } else {
        return JSON.stringify(session);
    }
}

export const currentSessionStore = persistentAtom<SessionStore | undefined>(
    "stands-web.current_session",
    undefined,
    {
        encode: encodeSession,
        decode: decodeSession,
    }
);

export const refresh = action(
    currentSessionStore,
    "refresh",
    async (store, client: ClientConfig) => {
        const value = store.get();
        if (typeof value === "undefined") {
            throw new Error("no session avaliable");
        } else {
            const result = await refreshSession(client, value.session);
            if (isRight(result)) {
                const newSession = unboxRight(result);
                const infoResult = await getUserPublicInfo(
                    client,
                    newSession.accessTokenObject.userid
                );
                if (isRight(infoResult)) {
                    const info = unboxRight(infoResult);
                    store.set({
                        account: info,
                        session: newSession,
                    });
                } else {
                    throw unboxLeft(infoResult);
                }
            } else {
                throw unboxLeft(result);
            }
        }
    }
);

export function getIdPresentation(
    sessionStore: SessionStore
): string | undefined {
    if (typeof sessionStore !== "undefined") {
        if (sessionStore.account) {
            return `@${sessionStore.account.username}@lightstands.xyz`;
        } else {
            return `${sessionStore.session.accessTokenObject.userid}@lightstands.xyz`;
        }
    } else {
        return undefined;
    }
}

export const revokeSession = action(
    currentSessionStore,
    "revokeSession",
    async (store, client: ClientConfig) => {
        const session = store.get();
        if (session) {
            await aunwrap(revokeRemoteSession(client, session.session));
            store.set(undefined);
            await resetData();
        }
    }
);

export const useSession = () => {
    return useStore(currentSessionStore);
};

export const addSession = action(
    currentSessionStore,
    "add",
    (store, session: Session) => {
        store.set({
            session,
        });
    }
);
