/* @refresh reload */
// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later
import "@formatjs/intl-locale";

import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import type { ClientConfig } from "lightstands-js";

import App from "./App";
import { ClientProvider } from "./client";
import { makeI18nContext } from "./common/i18n-wrapper";

import "./index.css";
import { I18nContext } from "@solid-primitives/i18n";

const clientConfig: ClientConfig = {
    endpointBase: import.meta.env.VITE_LIGHTSTANDS_ENDPOINT_BASE,
    clientId: import.meta.env.VITE_LIGHTSTANDS_CLIENT_ID,
    clientSecret: import.meta.env.VITE_LIGHTSTANDS_CLIENT_SECRET,
};

const i18nCx = makeI18nContext();

render(
    () => (
        <>
            <ClientProvider value={clientConfig}>
                <I18nContext.Provider value={i18nCx}>
                    <Router>
                        <App />
                    </Router>
                </I18nContext.Provider>
            </ClientProvider>
        </>
    ),
    document.getElementById("root") as HTMLElement
);

import("./common/swbridge").then((mod) => {
    mod.useServiceWorker();
});
