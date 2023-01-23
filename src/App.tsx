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
          "/session": lazy(() => import("./_dev/session")),
          "/euid": lazy(() => import("./_dev/EUID")),
          "/tags": lazy(() => import("./_dev/tags")),
          "/feedlists": lazy(() => import("./_dev/feedlists")),
      }
    : {};

const UnknownErrorPage = lazy(() => import("./Errors/unknown"));

const SignOutPage = lazy(() => import("./Sessions/signout"));

const FeedPage = lazy(() => import("./Feeds/feed"));

const Scaffold = lazy(() => import("./common/Scaffold"));

const PostPage = lazy(() => import("./Feeds/post"));

const DefaultFeedListPage = lazy(() => import("./FeedLists/default"));

const TimelinePage = lazy(() => import("./FeedLists/timeline"));

const SignUpEmailFlow0 = lazy(() => import("./UsrCreation/EmailFlowStage0"));
const SignUpEmailFlow1 = lazy(() => import("./UsrCreation/EmailFlowStage1"));
const SignUpSetPassword = lazy(() => import("./UsrCreation/SetPassword"));

const SettingsPage = lazy(() => import("./Settings/settings"));
const SettingStoragePage = lazy(() => import("./Settings/storage"));
const SettingCompatPage = lazy(() => import("./Settings/compat"));

const App: Component = () => {
    return (
        <Routes>
            <Route path="/oauth2" component={OAuth2ConfirmPage} />
            <Route path="/sign-in" component={SessionSignIn} />
            <Route path="/sign-out" component={SignOutPage} />
            <Route path="/sign-up">
                <Route path="/" component={SignUpEmailFlow0} />
                <Route path="/email">
                    <Route path="/" component={SignUpEmailFlow0} />
                    <Route path="/:email" component={SignUpEmailFlow1} />
                </Route>
                <Route path="/set-password" component={SignUpSetPassword} />
            </Route>
            <Route
                path={"/"}
                component={() => (
                    <Scaffold>
                        <Outlet />
                    </Scaffold>
                )}
            >
                <Route path="/" component={TimelinePage} />
                <Route path="/settings">
                    <Route path="/" component={SettingsPage} />
                    <Route path="/storage" component={SettingStoragePage} />
                    <Route
                        path="/compatibility"
                        component={SettingCompatPage}
                    />
                </Route>
                <Route path="/feedlists">
                    <Route path="/default" component={DefaultFeedListPage} />
                </Route>
                <Route path="/feeds">
                    <Route path="/:feed/posts/:post" component={PostPage} />
                    <Route path="/:feed" component={FeedPage} />
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
