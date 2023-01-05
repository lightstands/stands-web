import { Box, ButtonBase, Toolbar, Typography } from "@suid/material";
import { Component, createUniqueId, JSX, Show } from "solid-js";

import {
    Close as CloseIcon,
    ContentCopy as ContentCopyIcon,
} from "@suid/icons-material";

import ToolbarTitle from "../common/ToolbarTitle";
import BottomSheet from "../common/BottomSheet";
import ToolbarIcon from "../common/ToolbarIcon";

import "./AltShare.css";

interface ShareIconButtonProps {
    onClick?: (ev: MouseEvent) => void;
    icon: JSX.Element;
    title: string;
    iconBackgroundColor?: string;
}

const ShareIconButton: Component<ShareIconButtonProps> = (props) => {
    const labelId = createUniqueId();
    return (
        <ButtonBase
            onClick={props.onClick}
            class="AltShareIconButton"
            focusRipple={true}
            aria-labelledby={labelId}
        >
            <div
                class="IconBackground"
                style={{ "background-color": props.iconBackgroundColor }}
            >
                {props.icon}
            </div>

            <Typography
                sx={{
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    overflowX: "hidden",
                }}
                id={labelId}
            >
                {props.title}
            </Typography>
        </ButtonBase>
    );
};

export interface AltSharingObject {
    title?: string;
    url?: string;
}

interface AltShareProps {
    sharing?: AltSharingObject;
    onClose: (
        ev: {},
        reason:
            | "escapeKeyDown"
            | "backdropClick"
            | "closeClick"
            | "operationComplete"
    ) => void;
}

type BuiltInSupportedMethod = "copyLink";

const AltShare: Component<AltShareProps> = (props) => {
    const canCopyLink = () => {
        return Boolean(
            navigator.clipboard &&
                typeof navigator.clipboard.writeText !== "undefined" &&
                props.sharing?.url
        );
    };
    const builtInSupports = (): Record<BuiltInSupportedMethod, boolean> => ({
        copyLink: canCopyLink(),
    });

    const bulitInSupportsCount = () => {
        let n = 0;
        const obj = builtInSupports();
        for (const k in obj) {
            if (obj[k as BuiltInSupportedMethod]) {
                n += 1;
            }
        }
        return n;
    };

    const hasAnySupportedMethod = () => bulitInSupportsCount() > 0;

    const copyLink = async () => {
        if (props.sharing?.url) {
            await navigator.clipboard.writeText(props.sharing.url);
        }
        props.onClose({}, "operationComplete");
    };
    return (
        <BottomSheet
            open={typeof props.sharing !== "undefined"}
            onClose={props.onClose}
            zIndex={2000}
        >
            <Toolbar>
                <ToolbarIcon
                    onClick={() => props.onClose({}, "closeClick")}
                    ariaLabel="Close"
                >
                    <CloseIcon />
                </ToolbarIcon>
                <ToolbarTitle
                    primary={
                        props.sharing?.title
                            ? `Sharing "${props.sharing.title
                                  .replace('"', "'")
                                  .replace("'", '"')}"`
                            : "Sharing..."
                    }
                />
            </Toolbar>
            <Box
                component="ul"
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    flexDirection: "row",
                    listStyle: "none",
                    padding: "0 16px 0 16px",
                }}
            >
                <Show
                    when={hasAnySupportedMethod()}
                    fallback={
                        <Box
                            sx={{
                                display: "flex",
                                width: "100%",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Typography>
                                No sharing method available.
                            </Typography>
                        </Box>
                    }
                >
                    <Show when={builtInSupports().copyLink}>
                        <li>
                            <ShareIconButton
                                icon={<ContentCopyIcon />}
                                title="Copy link"
                                iconBackgroundColor="whitesmoke"
                                onClick={copyLink}
                            />
                        </li>
                    </Show>
                </Show>
            </Box>
        </BottomSheet>
    );
};

export default AltShare;
