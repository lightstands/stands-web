// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

// Copy from https://github.com/TheMagicBoard/Web-project/blob/master/src/pages/ErrorPage/index.tsx
import { useLocation } from "@solidjs/router";
import { Component, Match, Switch } from "solid-js";
import { useI18n } from "../platform/i18n";

interface ErrorPageProps {
    httpErrCode: number;
}

const ErrorPage: Component<ErrorPageProps> = (p) => {
    const location = useLocation();
    const [t] = useI18n();

    return (
        <>
            <style>{`
            ins {
                color: #777;
                text-decoration: none;
            }
            p {
                margin: 11px 0 22px;
                overflow: hidden;
            }
            code {
                word-wrap: break-word;
            }
            * {
                margin: 0;
                padding: 0;
            }
            #app {
                background: #fff;
                color: #222;
                padding: 15px;
            }
            div {
                padding-right: 205px;
                margin: 7% auto 0;
                max-width: 390px;
                min-height: 180px;
                padding: 30px 0 15px;
            }
            @media screen and (max-width: 772px) {
                div {
                    margin-top: 0;
                    max-width: none;
                    padding-right: 0;
                }
            }
        `}</style>
            <div>
                <p>
                    <b>{p.httpErrCode}.</b>
                    <ins>{t("unknownErrorTitle", undefined)}</ins>
                </p>
                <Switch
                    fallback={
                        <p>
                            {t("unknownErrorNoExplain")}
                            <ins>{t("unknownErrorExplainEnd")}</ins>
                        </p>
                    }
                >
                    <Match when={p.httpErrCode === 404}>
                        <p>
                            {t("unknownError404Part0")}
                            <code>{location.pathname}</code>
                            {t("unknownError404Part1")}
                            <ins>{t("unknownErrorExplainEnd")}</ins>
                        </p>
                    </Match>
                </Switch>
            </div>
        </>
    );
};

export default ErrorPage;
