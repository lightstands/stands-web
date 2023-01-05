import Box from "@suid/material/Box";
import {
    Component,
    createEffect,
    createSignal,
    createUniqueId,
    For,
    JSX,
    Show,
} from "solid-js";
import Style from "./Style.module.css";
import { MoreVert as MoreVertIcon } from "@suid/icons-material";
import IconButton from "@suid/material/IconButton";
import Popover from "@suid/material/Popover";
import List from "@suid/material/List";

interface AdvMenuProps {
    expanded: JSX.Element[];
    hidden: JSX.Element[];
}

export function getExpandableIconNumber(
    suggestWidth: number | undefined | null,
    iconNumber: number
) {
    if (suggestWidth) {
        const n = Math.floor(suggestWidth / 48);
        if (n >= iconNumber) {
            return n;
        } else {
            return n - 1;
        }
    } else {
        return 0;
    }
}

const AdvMenu: Component<AdvMenuProps> = (props) => {
    let buttonEl;
    const [showMore, setShowMore] = createSignal(false);

    const poperId = createUniqueId();

    return (
        <>
            <Box class={Style.FlexboxRow}>
                <For each={props.expanded}>{(item) => item}</For>
                <Show when={props.hidden.length > 0}>
                    <IconButton
                        size="large"
                        color="inherit"
                        onClick={() => setShowMore(true)}
                        class="tooltip"
                        aria-label="Open menu"
                        aria-description="More items"
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Popover
                        id={poperId}
                        open={showMore()}
                        anchorEl={buttonEl}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}
                        PaperProps={{
                            sx: {
                                borderRadius: "2px",
                                overscrollBehavior: "contain",
                                maxHeight: "calc(100vh - 32px)",
                                overflowY: "auto",
                            },
                        }}
                        onClose={() => setShowMore(false)}
                    >
                        <List disablePadding sx={{ minWidth: "160px" }}>
                            <For each={props.hidden}>
                                {(item) => {
                                    return item;
                                }}
                            </For>
                        </List>
                    </Popover>
                </Show>
            </Box>
        </>
    );
};

export default AdvMenu;
