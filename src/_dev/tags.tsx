import AppBar from "@suid/material/AppBar";
import Box from "@suid/material/Box";
import Toolbar from "@suid/material/Toolbar";
import { Accessor, Component, createSignal, For, Show } from "solid-js";
import ToolbarTitle from "../common/ToolbarTitle";
import Style from "../common/Style.module.css";
import Paper from "@suid/material/Paper";
import Typography from "@suid/material/Typography";
import TextField from "@suid/material/TextField";
import TableContainer from "@suid/material/TableContainer";
import TableHead from "@suid/material/TableHead";
import Table from "@suid/material/Table";
import TableCell from "@suid/material/TableCell";
import TableRow from "@suid/material/TableRow";
import Button from "@suid/material/Button";
import { getWorkingTasks, getWorkingErrors, doSync } from "../common/synmgr";
import { tagPost, untagPost } from "../stores/tags";
import { from } from "solid-js";
import { liveQuery } from "dexie";
import TableBody from "@suid/material/TableBody";
import { openDb } from "../stores/db";
import { error2explain } from "../common/utils";
import { useClient } from "../client";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";

function useLiveQuery<T>(
    querier: () => T | Promise<T>
): Accessor<T | undefined> {
    return from(liveQuery<T>(querier));
}

const TagsDevPage: Component = () => {
    const client = useClient();
    const session = useStore(currentSessionStore);
    const [tagName, setTagName] = createSignal("_read");
    const [postRef, setPostRef] = createSignal(0);
    const [feedUrlB3B64, setFeedUrlB3B64] = createSignal("");
    const [postIdB3B64, setPostIdB3B64] = createSignal("");

    const tagRows = useLiveQuery(async () => {
        const db = await openDb();
        return db.postTags.toArray();
    });

    const isTagSyncWorking = () => getWorkingTasks().some((v) => v === "tags");
    return (
        <>
            <Box>
                <AppBar position="static">
                    <Toolbar>
                        <ToolbarTitle primary="Tags" />
                    </Toolbar>
                </AppBar>
                <Box
                    class={
                        /* @once */ `${Style.FlexboxRow} ${Style.FixedCenterX}`
                    }
                    sx={{ flexWrap: "wrap", gap: "8px", padding: "8px" }}
                >
                    <Paper
                        class={Style.FlexboxCol}
                        sx={{
                            flexGrow: 1,
                            padding: "8px",
                            gap: "2px",
                            borderRadius: "2px",
                        }}
                    >
                        <Typography variant="h6">Tag a post</Typography>
                        <TextField
                            variant="standard"
                            label="Tag Name"
                            fullWidth={true}
                            value={tagName()}
                            onChange={(e) => setTagName(e.target.value)}
                        />
                        <TextField
                            variant="standard"
                            label="Post Ref"
                            type="number"
                            fullWidth={true}
                            value={postRef()}
                            onChange={(e) => setPostRef(Number(e.target.value))}
                        />
                        <TextField
                            variant="standard"
                            label="Feed Url Blake3 Base64"
                            fullWidth={true}
                            value={feedUrlB3B64()}
                            onChange={(e) => setFeedUrlB3B64(e.target.value)}
                        />
                        <TextField
                            variant="standard"
                            label="Post Id Blake3 Base64"
                            fullWidth={true}
                            value={postIdB3B64()}
                            onChange={(e) => setPostIdB3B64(e.target.value)}
                        />

                        <Box
                            class={Style.ButtonGroupEndAligned}
                            sx={{ marginTop: "6px" }}
                        >
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={() =>
                                    untagPost(
                                        tagName(),
                                        postRef(),
                                        feedUrlB3B64(),
                                        postIdB3B64()
                                    )
                                }
                            >
                                Untag
                            </Button>
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={() =>
                                    tagPost(
                                        tagName(),
                                        postRef(),
                                        feedUrlB3B64(),
                                        postIdB3B64()
                                    )
                                }
                            >
                                Tag
                            </Button>
                        </Box>

                        <Typography variant="h6">Synchronisation</Typography>
                        <Typography>
                            Working: {isTagSyncWorking() ? "Yes" : "No"}
                        </Typography>
                        <Typography>
                            Error: {getWorkingErrors().tags ? "Yes" : "No"}
                        </Typography>
                        <Show when={getWorkingErrors().tags}>
                            <Box
                                sx={{
                                    overflow: "auto",
                                    maxWidth: "calc(100vw - 32px)",
                                }}
                            >
                                <Typography component="pre">
                                    {error2explain(getWorkingErrors().tags!)}
                                </Typography>
                            </Box>
                        </Show>
                        <Box class={Style.ButtonGroupEndAligned}>
                            <Button
                                variant="contained"
                                disableElevation
                                disabled={isTagSyncWorking() || !session()}
                                onClick={() =>
                                    doSync(client, session()!.session)
                                }
                            >
                                Trigger Full Sync
                            </Button>
                        </Box>
                    </Paper>
                    <Paper
                        class={Style.FlexboxCol}
                        sx={{
                            flexGrow: 4,
                            padding: "8px",
                            paddingBottom: 0,
                            borderRadius: "2px",
                        }}
                    >
                        <Typography variant="h6">All tags</Typography>
                        <TableContainer sx={{ maxWidth: "calc(100vw - 32px)" }}>
                            <Table sx={{}}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>tag</TableCell>
                                        <TableCell>post_ref</TableCell>
                                        <TableCell>created_at</TableCell>
                                        <TableCell>updated_at</TableCell>
                                        <TableCell>
                                            feed_url_blake3_base64
                                        </TableCell>
                                        <TableCell>
                                            post_id_blake3_base64
                                        </TableCell>
                                        <TableCell>is_sync</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <For each={tagRows()}>
                                        {(item, index) => {
                                            return (
                                                <TableRow>
                                                    <TableCell>
                                                        {item.tag}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.post_ref.toString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {String(
                                                            item.created_at
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.updated_at.toString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {
                                                            item.feed_url_blake3_base64
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {
                                                            item.post_id_blake3_base64
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {String(item.is_sync)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }}
                                    </For>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            </Box>
        </>
    );
};

export default TagsDevPage;
