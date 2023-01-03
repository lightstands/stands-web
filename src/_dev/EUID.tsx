// Copyright 2022 The LightStands Web Contributors.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import AppBar from "@suid/material/AppBar";
import Box from "@suid/material/Box";
import IconButton from "@suid/material/IconButton";
import Paper from "@suid/material/Paper";
import TextField from "@suid/material/TextField";
import Toolbar from "@suid/material/Toolbar";
import Typography from "@suid/material/Typography";
import { Component, createEffect, createSignal } from "solid-js";
import ArrowDownThick from "../assets/ArrowDownThick";
import ArrowUpThick from "../assets/ArrowUpThick";
import CommonStyle from "./common.module.css";
import { randeuid, inspectTimestamp, TS_OFFSET } from "lightstands-js";
import { default as ClockIcon } from "../assets/Clock";

const EUIDPage: Component = () => {
    const [timestamp, setTimestamp] = createSignal("");
    const [euid, setEUId] = createSignal("");
    const [timestampError, setTimestampError] = createSignal<string>();
    const [euidError, setEUIdError] = createSignal<string>();
    const [currentTimeString, setCurrentTimeString] = createSignal<string>();

    const genEUId = () => {
        const ts = Number.parseInt(timestamp());
        const euid = randeuid(ts);
        setEUId(euid.toString());
    };

    const inspectTs = () => {
        const id = Number.parseInt(euid());
        const ts = inspectTimestamp(id);
        setTimestamp(ts.toString());
    };

    createEffect(() => {
        if (timestamp() === "") {
            return;
        }
        try {
            Number.parseInt(timestamp());
        } catch {
            setCurrentTimeString(undefined);
            setTimestampError("Bad number");
        }
        const ts = Number.parseInt(timestamp());
        if (ts < TS_OFFSET) {
            setTimestampError(
                `Timestamp should be larger than or equal to ${TS_OFFSET}`
            );
        }
        setCurrentTimeString(new Date(ts * 1000).toISOString());
    });

    createEffect(() => {
        try {
            Number.parseInt(timestamp());
        } catch {
            setEUIdError("Bad number");
        }
    });

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        EUId Playground
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                class={
                    CommonStyle.ViewpointXCenter +
                    " " +
                    CommonStyle.SmartFullMaxWidth
                }
            >
                <Paper
                    class={CommonStyle.BodyCardMargin}
                    sx={{ padding: "16px" }}
                >
                    <Box sx={{ display: "flex", flexDirection: "row" }}>
                        <TextField
                            label="Timestamp"
                            variant="standard"
                            fullWidth
                            value={timestamp()}
                            onChange={(ev) => setTimestamp(ev.target.value)}
                            error={!!timestampError()}
                            helperText={timestampError() || currentTimeString()}
                        ></TextField>
                        <IconButton
                            onClick={() =>
                                setTimestamp(
                                    Math.floor(
                                        new Date().getTime() / 1000
                                    ).toString()
                                )
                            }
                        >
                            <ClockIcon />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            marginY: "12px",
                        }}
                    >
                        <Box
                            sx={{
                                flexGrow: 1,
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <IconButton size="large" onClick={inspectTs}>
                                <ArrowUpThick />
                            </IconButton>
                        </Box>
                        <Box
                            sx={{
                                flexGrow: 1,
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <IconButton size="large" onClick={genEUId}>
                                <ArrowDownThick />
                            </IconButton>
                        </Box>
                    </Box>
                    <TextField
                        label="EUId"
                        variant="standard"
                        fullWidth
                        value={euid()}
                        onChange={(ev) => setEUId(ev.target.value)}
                        error={!!euidError()}
                        helperText={euidError()}
                    />
                </Paper>
            </Box>
        </>
    );
};

export default EUIDPage;
