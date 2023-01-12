import {
    IconButton,
    Toolbar,
    TextField,
    Typography,
    Box,
} from "@suid/material";
import { Component, createSignal, Match, Switch } from "solid-js";
import { Close as CloseIcon, Check as CheckIcon } from "@suid/icons-material";
import { isRight, PublicFeed, resolveFeed, unbox } from "lightstands-js";
import { useStore } from "@nanostores/solid";

import ToolbarTitle from "../common/ToolbarTitle";
import { useClient } from "../client";
import { currentSessionStore } from "../stores/session";
import { addFeedToList } from "../stores/feedlists";
import { useI18n } from "../platform/i18n";
import { syncPostMetaOf } from "../stores/postmeta";

interface AddFeedDlgProps {
    listId: number;
    onClose?: (ev: {}, reason: "bottonClick") => void;
}

const AddFeedDlg: Component<AddFeedDlgProps> = (props) => {
    // state = enter-url(0) resolve-url(1) add-to-list(2) result
    // result = success(3) | enter-url(0)
    const [currentState, setCurrentState] = createSignal<0 | 1 | 2 | 3>(0);
    const [feedUri, setFeedUri] = createSignal("");
    const client = useClient();
    const session = useStore(currentSessionStore);
    const [t] = useI18n();
    const [feed, setFeed] = createSignal<PublicFeed>();

    const addToList = async () => {
        await addFeedToList(
            client,
            session()!.session,
            props.listId,
            feed()!.urlBlake3
        );
        setCurrentState(3);
        await syncPostMetaOf(client, feed()!.ref);
    };

    const resolveUrl = async () => {
        setCurrentState(1);
        const result = await resolveFeed(client, session()!.session, feedUri());
        if (isRight(result)) {
            setFeed(unbox(result));
            setCurrentState(2);
            await addToList();
        } else {
            setCurrentState(0);
        }
    };

    const getFeedName = () => {
        return feed()?.title || t("feedDefaultName");
    };
    return (
        <>
            <Toolbar>
                <Switch>
                    <Match when={currentState() === 0}>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            sx={{ mr: 2 }}
                            onClick={() => {
                                if (props.onClose) {
                                    props.onClose({}, "bottonClick");
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <ToolbarTitle
                            primary={t("addFeedTitle", {
                                listName: t("listNameSubscribed"),
                            })}
                        />
                        <IconButton
                            size="large"
                            edge="end"
                            color="inherit"
                            onClick={() => resolveUrl()}
                            disabled={!feedUri()}
                        >
                            <CheckIcon />
                        </IconButton>
                    </Match>
                    <Match when={currentState() === 1 || currentState() === 2}>
                        <ToolbarTitle
                            primary={t(
                                "addingFeed",
                                { listName: t("listNameSubscribed") },
                                "Adding feed to list..."
                            )}
                        />
                    </Match>
                    <Match when={currentState() === 3}>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            sx={{ mr: 2 }}
                            onClick={() => {
                                if (props.onClose) {
                                    props.onClose({}, "bottonClick");
                                }
                                setCurrentState(0);
                                setFeedUri("");
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <ToolbarTitle
                            primary={t("addedFeed", {
                                listName: t("listNameSubscribed"),
                                feedName: getFeedName(),
                            })}
                        />
                    </Match>
                </Switch>
            </Toolbar>
            <Box
                sx={{
                    paddingX: "24px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Switch>
                    <Match when={currentState() === 0}>
                        <TextField
                            variant="standard"
                            label={t("addFeedURI")}
                            value={feedUri()}
                            onChange={(ev) => setFeedUri(ev.target.value)}
                            autoFocus
                        />
                        <Typography variant="caption" sx={{ marginY: "8px" }}>
                            {t("feedStdTip")}
                        </Typography>
                    </Match>
                    <Match when={currentState() === 1}>
                        <Typography sx={{ marginY: "8px" }}>
                            {t("resolvingFeed", { feedUri: feedUri() })}
                        </Typography>
                    </Match>
                    <Match when={currentState() === 2}>
                        <Typography sx={{ marginY: "8px" }}>
                            {t("addingFeedLong", { feedName: getFeedName() })}
                        </Typography>
                    </Match>
                    <Match when={currentState() === 3}>
                        <Typography sx={{ marginY: "8px" }}>
                            {t("addedFeedLong", { feedName: getFeedName() })}
                        </Typography>
                    </Match>
                </Switch>
            </Box>
        </>
    );
};

export default AddFeedDlg;
