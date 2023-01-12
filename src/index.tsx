/* @refresh reload */
// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later
import "@formatjs/intl-locale";

import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import type { ClientConfig } from "lightstands-js";

import App from "./App";
import { ClientProvider } from "./client";
import { I18nScope } from "./common/i18n-wrapper";

import "./index.css";

const clientConfig: ClientConfig = {
    endpointBase: import.meta.env.VITE_LIGHTSTANDS_ENDPOINT_BASE,
    clientId: import.meta.env.VITE_LIGHTSTANDS_CLIENT_ID,
    clientSecret: import.meta.env.VITE_LIGHTSTANDS_CLIENT_SECRET,
};

render(
    () => (
        <>
            <ClientProvider value={clientConfig}>
                <I18nScope>
                    <Router>
                        <App />
                    </Router>
                </I18nScope>
            </ClientProvider>
        </>
    ),
    document.getElementById("root") as HTMLElement
);

import("./common/swbridge").then((mod) => {
    mod.useServiceWorker();
});
