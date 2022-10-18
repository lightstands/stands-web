import Box from "@suid/material/Box";
import Drawer from "@suid/material/Drawer";
import Modal from "@suid/material/Modal";
import Paper from "@suid/material/Paper";
import { ParentComponent, Show } from "solid-js";
import { useScaffold } from "../common/Scaffold";

interface BottomSheetProps {
    open: boolean;
    onClose?: (ev: {}, reason: "backdropClick" | "escapeKeyDown") => void;
}

const BottomSheet: ParentComponent<BottomSheetProps> = (props) => {
    const scaffoldCx = useScaffold();
    return (
        <Show
            when={(scaffoldCx.state.width || 0) >= 772}
            fallback={
                <Drawer
                    variant="temporary"
                    anchor="bottom"
                    open={props.open}
                    onClose={props.onClose}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            minHeight: "52vh",
                        }}
                    >
                        {props.children}
                    </Box>
                </Drawer>
            }
        >
            <Modal open={props.open} onClose={props.onClose}>
                <Paper
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        position: "relative",
                        maxWidth: "560px",
                    }}
                >
                    {props.children}
                </Paper>
            </Modal>
        </Show>
    );
};

export default BottomSheet;
