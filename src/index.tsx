/* @refresh reload */
// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later
import { render } from "solid-js/web";
import { Router } from "@solidjs/router";

import "./index.css";
import App from "./App";
import { ClientProvider } from "./client";
import type { ClientConfig } from "lightstands-js";

const clientConfig: ClientConfig = {
    endpointBase: import.meta.env.VITE_LIGHTSTANDS_ENDPOINT_BASE,
    clientId: import.meta.env.VITE_LIGHTSTANDS_CLIENT_ID,
    clientSecret: import.meta.env.VITE_LIGHTSTANDS_CLIENT_SECRET,
};

render(
    () => (
        <>
            <ClientProvider value={clientConfig}>
                <Router>
                    <App />
                </Router>
            </ClientProvider>
        </>
    ),
    document.getElementById("root") as HTMLElement
);

import("./common/swbridge").then((mod) => {
    mod.useServiceWorker();
});
