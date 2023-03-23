import { Box, Button, Toolbar, Typography } from "@suid/material";
import { Component } from "solid-js";

import { useI18n } from "../platform/i18n";
import Dialog from "./Dialog";
import Style from "../common/Style.module.css";
import { openExternalUrl } from "../platform/open-url";

interface UrlOpenConfirmProps {
    url?: string | URL;
    onClose: (e: {}, reason: "backdropClick" | "escapeKeyDown") => void;
}

const UrlOpenConfirm: Component<UrlOpenConfirmProps> = (props) => {
    const [t] = useI18n();
    return (
        <Dialog open={!!props.url} onClose={props.onClose}>
            <Toolbar>
                <Typography variant="h6">
                    {t("askIfOpenLink", undefined, "Open this link?")}
                </Typography>
            </Toolbar>
            <Box sx={{ marginX: "16px" }}>
                <Typography sx={{ wordWrap: "break-word" }}>
                    {props.url?.toString()}
                </Typography>
            </Box>
            <Box
                class={Style.ButtonGroupEndAligned}
                sx={{ paddingY: "12px", paddingX: "16px" }}
            >
                <Button onClick={() => props.onClose({}, "escapeKeyDown")}>
                    {t("cancel", undefined, "Cancel")}
                </Button>
                <Button
                    onClick={() => {
                        openExternalUrl(props.url!);
                        props.onClose({}, "escapeKeyDown");
                    }}
                >
                    {t("open", undefined, "Open")}
                </Button>
            </Box>
        </Dialog>
    );
};

export default UrlOpenConfirm;
