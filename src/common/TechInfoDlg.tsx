// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { Component, Show } from "solid-js";
import {
    Modal,
    Card,
    CardContent,
    IconButton,
    Toolbar,
    Typography,
} from "@suid/material";
import { Close as CloseIcon } from "@suid/icons-material";

import Style from "./TechInfoDlg.module.css";

interface TechInfoDialogProps {
    open: boolean;
    onClose: (
        event: {},
        reason: "backdropClick" | "escapeKeyDown" | "buttonClick"
    ) => void;
    value?: string;
}

const TechInfoDialog: Component<TechInfoDialogProps> = (props) => {
    return (
        <>
            <Modal
                open={props.open}
                onClose={props.onClose}
                sx={{ zIndex: Number.MAX_SAFE_INTEGER }}
            >
                <Card elevation={0} class={Style.SmartDialog}>
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="close"
                            onClick={() => props.onClose({}, "buttonClick")}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Technical Information
                        </Typography>
                    </Toolbar>
                    <CardContent
                        sx={{
                            overflow: "auto",
                            whiteSpace: "pre",
                            maxHeight: Math.floor(window.screen.height * 0.5),
                        }}
                    >
                        <Show when={props.value}>
                            <code>{props.value}</code>
                        </Show>
                    </CardContent>
                </Card>
            </Modal>
        </>
    );
};

export default TechInfoDialog;
