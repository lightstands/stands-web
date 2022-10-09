// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { Component, For, Show } from "solid-js";
import { Outlet, Route, Routes } from "@solidjs/router";
import { lazy } from "solid-js";

const OAuth2ConfirmPage = lazy(() => import("./OAuth2/confirm"));

const SessionSignIn = lazy(() => import("./Sessions/signin"));

const devPages = import.meta.env.DEV
    ? {
          "/": lazy(() => import("./_dev/IndexPage")),
          "/oauth2": lazy(() => import("./_dev/OAuth2Test")),
          "/session": lazy(() => import("./_dev/session")),
      }
    : {};

const UnknownErrorPage = lazy(() => import("./Errors/unknown"));

const SignOutPage = lazy(() => import("./Sessions/signout"));

const FeedPage = lazy(() => import("./Feeds/feed"));

const Scaffold = lazy(() => import("./common/Scaffold"));

const App: Component = () => {
    return (
        <Routes>
            <Route path="/oauth2" component={OAuth2ConfirmPage} />
            <Route path="/sign-in" component={SessionSignIn} />
            <Route path="/sign-out" component={SignOutPage} />
            <Route path="/feeds">
                <Route
                    path="/:feed"
                    component={() => (
                        <Scaffold>
                            <FeedPage />
                        </Scaffold>
                    )}
                >
                    <Route path="/" />
                    <Route
                        path="/posts/:post"
                        component={() => <p>Placeholder</p>}
                    />
                </Route>
            </Route>

            <Show when={import.meta.env.DEV}>
                <Route path="/_dev">
                    <For each={Object.keys(devPages)}>
                        {(k) => (
                            <Route
                                path={k}
                                component={
                                    (devPages as Record<string, Component>)[k]
                                }
                            />
                        )}
                    </For>
                </Route>
            </Show>
            <Route path="/*" element={<UnknownErrorPage httpErrCode={404} />} />
        </Routes>
    );
};

export default App;
