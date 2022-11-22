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
    suggestWidth?: number;
    totalIconNumber: number;
    expanded: JSX.Element[];
    onExpandedIconNumberChanged: (iconNumber: number) => void;
    hidden: JSX.Element[];
}

const AdvMenu: Component<AdvMenuProps> = (props) => {
    let buttonEl;
    const [showMore, setShowMore] = createSignal(false);
    const expandedIconNumber = () => {
        if (props.suggestWidth) {
            const n = Math.floor(props.suggestWidth / 48);
            if (n === props.totalIconNumber) {
                return n;
            } else {
                return n - 1; // left one item space for the more button
            }
        } else {
            return 0;
        }
    };

    createEffect(() => {
        const n = expandedIconNumber();
        props.onExpandedIconNumberChanged(n);
    });

    const poperId = createUniqueId();

    return (
        <>
            <Box class={Style.FlexboxRow}>
                <For each={props.expanded}>{(item) => item}</For>
                <Show when={!!props.hidden}>
                    <IconButton
                        size="large"
                        color="inherit"
                        onClick={() => setShowMore(true)}
                        class="tooltip"
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
                        PaperProps={{ sx: { borderRadius: "2px" } }}
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
