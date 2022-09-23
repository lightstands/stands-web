// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import type { ClientConfig } from "lightstands-js";
import { createContext, ParentComponent, useContext } from "solid-js";

interface ClientCxType {
    client: ClientConfig;
}

export const ClientCx = createContext<ClientCxType>();

export const ClientProvider: ParentComponent<{ value: ClientConfig }> = (
    props
) => {
    return (
        <ClientCx.Provider value={{ client: props.value }}>
            {props.children}
        </ClientCx.Provider>
    );
};

export function useClient(): ClientConfig {
    const cx = useContext(ClientCx);
    if (typeof cx !== "undefined") {
        return cx.client;
    } else {
        throw new Error("unable to get client context");
    }
}
