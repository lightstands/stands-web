import { Modal, Paper } from "@suid/material";
import { ParentComponent } from "solid-js";

import OwnStyle from "./Dialog.module.css";

interface DialogProps {
    open: boolean;
    onClose: (e: {}, reason: "backdropClick" | "escapeKeyDown") => void;
}

const Dialog: ParentComponent<DialogProps> = (props) => {
    return (
        <Modal open={props.open} onClose={props.onClose}>
            <Paper
                component="dialog"
                role="dialog"
                aria-hidden="false"
                elevation={0}
                class={OwnStyle.dialog}
            >
                {props.children}
            </Paper>
        </Modal>
    );
};

export default Dialog;
