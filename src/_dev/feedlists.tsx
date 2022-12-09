import {
    AppBar,
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Toolbar,
    Typography,
} from "@suid/material";
import { Component, createSignal, For } from "solid-js";
import ToolbarTitle from "../common/ToolbarTitle";
import CommonStyle from "../common/Style.module.css";
import { doSync, getWorkingTasks } from "../common/synmgr";
import { useLiveQuery } from "../common/utils";
import { openDb } from "../stores/db";
import { inspectDate } from "lightstands-js";
import { useClient } from "../client";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";

const FeedListsDevPage: Component = () => {
    const client = useClient();

    const session = useStore(currentSessionStore);
    const [currentListId, setCurrentListId] = createSignal<number>();
    const allLocalLists = useLiveQuery(async () => {
        const db = await openDb();
        return db.feedlists.toArray();
    });

    const currentList = () => {
        const id = currentListId();
        if (typeof id !== "undefined") {
            const lists = allLocalLists();
            if (lists) {
                for (const el of lists) {
                    if (el.listid === id) {
                        const result = [];
                        for (const [feed, id] of el.includes) {
                            result.push({
                                feedUrlBlake3Base64: feed,
                                euid: id,
                                excluded: false,
                                created_at: inspectDate(id),
                            });
                        }
                        for (const id of el.excludes) {
                            let stillIncluded = false;
                            for (const entry of result) {
                                if (entry.euid === id) {
                                    entry.excluded = true;
                                    stillIncluded = true;
                                }
                            }
                            if (!stillIncluded) {
                                result.push({
                                    feedUrlBlake3Base64: null,
                                    euid: id,
                                    excluded: true,
                                    created_at: inspectDate(id),
                                });
                            }
                        }
                        return result;
                    }
                }
            }
        }
        return undefined;
    };

    return (
        <>
            <AppBar position="static" sx={{ marginBlockEnd: "16px" }}>
                <Toolbar>
                    <ToolbarTitle primary="Tags" />
                </Toolbar>
            </AppBar>
            <Box
                class={`${CommonStyle.SmartBodyWidth} ${CommonStyle.FixedCenterX}`}
            >
                <style>
                    {`.MuiPaper-root + .MuiPaper-root {
                        margin-block-start: 16px;
                    }`}
                </style>
                <Paper sx={{ padding: "12px 12px 12px 12px" }}>
                    <Typography variant="h6">Control Panel</Typography>
                    <Typography>
                        Working:{" "}
                        {getWorkingTasks().includes("feedlists")
                            ? "Working"
                            : "Idle"}
                    </Typography>
                    <Button
                        onClick={() =>
                            doSync(client, session()!.session, "feedlists")
                        }
                    >
                        Trigger Sync
                    </Button>
                </Paper>
                <Paper sx={{ padding: "12px 6px 0 6px" }}>
                    <Typography variant="h6">
                        Data{" "}
                        <select
                            value={currentListId()?.toString()}
                            onChange={(ev) =>
                                setCurrentListId(Number(ev.currentTarget.value))
                            }
                        >
                            <option label="Unset"></option>
                            <For each={allLocalLists() || []}>
                                {(item) => {
                                    return (
                                        <option
                                            label={item.listid.toString()}
                                            value={item.listid.toString()}
                                        ></option>
                                    );
                                }}
                            </For>
                        </select>
                    </Typography>
                    <TableContainer sx={{ maxWidth: "calc(100vw - 32px)" }}>
                        <Table sx={{}}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        feed_url_blake3_base64
                                    </TableCell>
                                    <TableCell>id</TableCell>
                                    <TableCell>excluded</TableCell>
                                    <TableCell>created_at</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <For each={currentList()}>
                                    {(item) => {
                                        return (
                                            <TableRow>
                                                <TableCell>
                                                    {item.feedUrlBlake3Base64 ||
                                                        ""}
                                                </TableCell>
                                                <TableCell>
                                                    {item.euid}
                                                </TableCell>
                                                <TableCell>
                                                    {item.excluded
                                                        ? "YES"
                                                        : "NO"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.created_at.toISOString()}
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
        </>
    );
};

export default FeedListsDevPage;
