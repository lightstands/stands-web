// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import {
    Component,
    createEffect,
    createResource,
    For,
    JSX,
    Match,
    Show,
    Switch,
} from "solid-js";
import { Params, useNavigate, useSearchParams } from "@solidjs/router";
import { useClient } from "../client";
import {
    App,
    aunwrap,
    getAppDetail,
    isLeft,
    isRight,
    newSession,
    Session,
    unboxLeft,
    unwrap,
} from "lightstands-js";
import Box from "@suid/material/Box";
import Card from "@suid/material/Card";
import LinearProgress from "@suid/material/LinearProgress";
import Typography from "@suid/material/Typography";
import CardHeader from "@suid/material/CardHeader";
import List from "@suid/material/List";
import ListItem from "@suid/material/ListItem";
import ListItemText from "@suid/material/ListItemText";
import CardContent from "@suid/material/CardContent";
import Divider from "@suid/material/Divider";
import SvgIcon from "@suid/material/SvgIcon";
import LogOutIcon from "@suid/icons-material/Logout";
import ViewListIcon from "@suid/icons-material/ViewList";
import Button from "@suid/material/Button";
import CardActions from "@suid/material/CardActions";
import Style from "./confirm.module.css";
import { createMediaQuery } from "@solid-primitives/media";
import { useStore } from "@nanostores/solid";
import { currentSessionStore, getIdPresentation } from "../stores/session";
import AccountCircleIcon from "@suid/icons-material/AccountCircle";

interface PermissionListProps {
    list: string[];
    displaySubtitle: boolean;
}

interface PermissionExplain {
    title: string;
    subtitle: string;
    iconEl?: () => JSX.Element;
}

const EXPLAINS: Record<string, PermissionExplain> = {
    "session.revoke_other": {
        title: "Sign out your login on other devices.",
        subtitle:
            "This application can sign out your login on the other devices.",
        iconEl: () => <LogOutIcon />,
    },
    "session.list": {
        title: "List all your avaliable login.",
        subtitle: "This application can list your login on all devices.",
        iconEl: () => <ViewListIcon />,
    },
    "user.change_password": {
        title: "Change your password without prompt.",
        subtitle: "This application can change your password sliently.",
        iconEl: () => (
            <SvgIcon>
                <path
                    fill="currentColor"
                    d="M17,7H22V17H17V19A1,1 0 0,0 18,20H20V22H17.5C16.95,22 16,21.55 16,21C16,21.55 15.05,22 14.5,22H12V20H14A1,1 0 0,0 15,19V5A1,1 0 0,0 14,4H12V2H14.5C15.05,2 16,2.45 16,3C16,2.45 16.95,2 17.5,2H20V4H18A1,1 0 0,0 17,5V7M2,7H13V9H4V15H13V17H2V7M20,15V9H17V15H20M8.5,12A1.5,1.5 0 0,0 7,10.5A1.5,1.5 0 0,0 5.5,12A1.5,1.5 0 0,0 7,13.5A1.5,1.5 0 0,0 8.5,12M13,10.89C12.39,10.33 11.44,10.38 10.88,11C10.32,11.6 10.37,12.55 11,13.11C11.55,13.63 12.43,13.63 13,13.11V10.89Z"
                />
            </SvgIcon>
        ),
    },
    "user.read": {
        title: "Read your private personal profile.",
        subtitle:
            "This app will able to read the private part of your personal profile on LightStands, including email address.",
        iconEl: () => <AccountCircleIcon />,
    },
    "feedlist.read": {
        title: "Read your feed lists",
        subtitle:
            "This app will be able to read all the feed lists you can access",
        iconEl: () => <ViewListIcon />,
    },
    "feedlist.write": {
        title: "Apply changes to your feed lists",
        subtitle:
            "This app will be able to apply changes all the feed lists you can apply changes",
        iconEl: () => <ViewListIcon />,
    },
    "feedlist.list": {
        title: "List your feed lists",
        subtitle:
            "This app will be able to list all the feed lists you can access",
        iconEl: () => <ViewListIcon />,
    },
};

function mapExplain<P>(
    key: string,
    funtor: (explain: PermissionExplain | undefined, key: string) => P
): P {
    return funtor(EXPLAINS[key], key);
}

const PermissionList: Component<PermissionListProps> = (props) => {
    const secondaryTypographyProps = () =>
        props.displaySubtitle ? undefined : { sx: { display: "none" } };
    return (
        <List disablePadding>
            <For each={props.list}>
                {(key, index) => {
                    return mapExplain(key, (explain, key) => (
                        <>
                            <Show when={index() !== 0}>
                                <Divider />
                            </Show>
                            <ListItem>
                                <Show
                                    when={typeof explain !== "undefined"}
                                    fallback={
                                        <ListItemText
                                            primary={`Unknown permission ${key}`}
                                        />
                                    }
                                >
                                    <Show when={explain!.iconEl}>
                                        <Box
                                            sx={{ marginInlineEnd: "8px" }}
                                            class={Style.HideOnSuperSmallScreen}
                                        >
                                            {explain!.iconEl!()}
                                        </Box>
                                    </Show>
                                    <ListItemText
                                        primary={explain!.title}
                                        secondary={explain!.subtitle}
                                        secondaryTypographyProps={secondaryTypographyProps()}
                                    />
                                </Show>
                            </ListItem>
                        </>
                    ));
                }}
            </For>
        </List>
    );
};

interface LSOAuth2SearchParams extends Params {
    client_id: string;
    redirecturi: string;
    auth_code: string;
    ua_id: string;
}

const ConfirmPage: Component = () => {
    const currentSession = useStore(currentSessionStore);
    const client = useClient();
    const navigate = useNavigate();
    const [params] = useSearchParams<LSOAuth2SearchParams>();
    const [app] = createResource<App, string, string>(
        params.client_id,
        (client_id: string) => {
            return aunwrap(getAppDetail(client, { client_id: client_id }));
        }
    );
    const isMidSmallerScreen = createMediaQuery("screen and (width < 600px)");
    const isSuperSmallScreen = createMediaQuery("screen and (width < 300px)");
    createEffect(() => {
        const session = currentSession();
        if (typeof session === "undefined") {
            const backPath = encodeURIComponent(
                window.location.pathname + window.location.search
            );
            navigate(`/sign-in?back=${backPath}`);
        }
    });
    createEffect(() => {
        if (app.state == "errored") {
            console.log("failed to fetch application information:", app.error);
        }
    });
    const appPermissions = () => {
        const appDetail = app();
        if (typeof appDetail !== "undefined") {
            const scopeString = appDetail.scope;
            return Array.from(scopeString.matchAll(/([\w\.]+)[\s]*/g))
                .map((match) => {
                    return match[1];
                })
                .sort();
        } else {
            return [];
        }
    };

    const continueProcess = async (
        appDetail: App,
        session: Session,
        confirmed: boolean
    ) => {
        const appSession = await newSession(
            client,
            session,
            appDetail.clientId,
            appDetail.scope,
            params.ua_id,
            undefined,
            params.auth_code
        );
        unwrap(appSession);
        if (!appDetail.redirectUri) {
            throw new Error("app must have redirectUri");
        }
        const target = new URL(
            `oauth2/~complete?confirmed=${
                confirmed ? "true" : "false"
            }&redirect_uri=${encodeURIComponent(
                appDetail.redirectUri
            )}&auth_code=${params.auth_code}`,
            client.endpointBase
        );
        window.location.replace(target);
    };

    const onContinue = async (comfirmed: boolean) => {
        const appDetail = app();
        const session = currentSession();
        if (appDetail && session) {
            await continueProcess(appDetail, session.session, comfirmed);
        } else {
            throw new Error("app or session is not found");
        }
    };
    return (
        <>
            <Box class={Style.SmartDialog}>
                <Card elevation={isMidSmallerScreen() ? 0 : 1}>
                    <Switch>
                        <Match when={app.loading}>
                            <LinearProgress />
                            <Box
                                sx={{
                                    minHeight: "60px",
                                    minWidth: "260px",
                                    textAlign: "center",
                                }}
                            >
                                <Typography>Please standby...</Typography>
                            </Box>
                        </Match>
                        <Match when={app.state == "ready"}>
                            <CardHeader
                                title={`"${app()?.name}" wants to...`}
                                subheader={
                                    <Typography>
                                        using{" "}
                                        <code>
                                            {currentSession()
                                                ? getIdPresentation(
                                                      currentSession()!
                                                  )
                                                : ""}
                                        </code>
                                        ...
                                    </Typography>
                                }
                            />
                            <CardContent>
                                <PermissionList
                                    list={appPermissions()}
                                    displaySubtitle={!isSuperSmallScreen()}
                                />
                                <Box sx={{ height: "100%" }} />
                                <Box sx={{ textAlign: "end" }}>
                                    <Typography variant="caption">
                                        When you click "Continue", LightStands
                                        will lead you to {app()?.redirectUri}
                                    </Typography>
                                </Box>
                            </CardContent>
                            <Divider />
                            <CardActions>
                                <Switch>
                                    <Match when={isMidSmallerScreen()}>
                                        <Box
                                            sx={{
                                                display: "block",
                                                width: "100%",
                                            }}
                                        >
                                            <Button
                                                sx={{
                                                    padding: "8px",
                                                    display: "flex",
                                                    width: "100%",
                                                    justifyContent: "end",
                                                    paddingRight: "48px",
                                                }}
                                                onClick={() => onContinue(true)}
                                            >
                                                Continue
                                            </Button>
                                            <Button
                                                sx={{
                                                    padding: "8px",
                                                    display: "flex",
                                                    width: "100%",
                                                    justifyContent: "end",
                                                    paddingRight: "48px",
                                                }}
                                                onClick={() =>
                                                    onContinue(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Match>
                                    <Match when={true}>
                                        <Box sx={{ justifyContent: "start" }}>
                                            <Button
                                                onClick={() =>
                                                    onContinue(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                        <Box
                                            sx={{
                                                justifyContent: "end",
                                                width: "100%",
                                                display: "inline-flex",
                                            }}
                                        >
                                            <Button
                                                onClick={() => onContinue(true)}
                                            >
                                                Continue
                                            </Button>
                                        </Box>
                                    </Match>
                                </Switch>
                            </CardActions>
                        </Match>
                        <Match when={app.state == "errored"}>
                            <Box sx={{ padding: "25px" }}>
                                <Typography>
                                    A mysterious problem has occurred.
                                </Typography>
                                <Typography>
                                    Your browser could not get the application
                                    information you head to, so we must stop
                                    here.
                                </Typography>
                                <Typography>
                                    This may be a temporary situation, please
                                    check your network and try again.
                                </Typography>
                            </Box>
                        </Match>
                    </Switch>
                </Card>
            </Box>
        </>
    );
};

export default ConfirmPage;
