import IconButton from "@suid/material/IconButton";
import Toolbar from "@suid/material/Toolbar";
import { Component, createSignal, Match, Switch } from "solid-js";
import { Close as CloseIcon, Check as CheckIcon } from "@suid/icons-material";
import ToolbarTitle from "../common/ToolbarTitle";
import Box from "@suid/material/Box";
import TextField from "@suid/material/TextField";
import Typography from "@suid/material/Typography";
import { isRight, PublicFeed, resolveFeed, unbox } from "lightstands-js";
import { useClient } from "../client";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";
import { addFeedToList } from "../stores/feedlists";

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
    const [feed, setFeed] = createSignal<PublicFeed>();

    const addToList = async () => {
        await addFeedToList(
            client,
            session()!.session,
            props.listId,
            feed()!.urlBlake3
        );
        setCurrentState(3);
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
                        <ToolbarTitle primary="New Feed for Subscribed..." />
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
                        <ToolbarTitle primary="Adding feed to list..." />
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
                        <ToolbarTitle primary={`"${feed()!.title}" added`} />
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
                            label="URI"
                            value={feedUri()}
                            onChange={(ev) => setFeedUri(ev.target.value)}
                            autoFocus
                        />
                        <Typography variant="caption" sx={{ marginY: "8px" }}>
                            The feed must use Atom or RSS standard.
                        </Typography>
                    </Match>
                    <Match when={currentState() === 1}>
                        <Typography sx={{ marginY: "8px" }}>
                            Resolving "{feedUri()}"...
                        </Typography>
                    </Match>
                    <Match when={currentState() === 2}>
                        <Typography sx={{ marginY: "8px" }}>
                            Adding "{feed()?.title}" to list...
                        </Typography>
                    </Match>
                    <Match when={currentState() === 3}>
                        <Typography sx={{ marginY: "8px" }}>
                            {feed()!.title} have been added to your list.
                        </Typography>
                    </Match>
                </Switch>
            </Box>
        </>
    );
};

export default AddFeedDlg;
