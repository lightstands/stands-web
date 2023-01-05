import Box from "@suid/material/Box";
import Drawer from "@suid/material/Drawer";
import Modal from "@suid/material/Modal";
import Paper from "@suid/material/Paper";
import { ParentComponent, Show } from "solid-js";
import { useScaffold } from "./Scaffold";
import CommonStyle from "./Style.module.css";

interface BottomSheetProps {
    open: boolean;
    onClose?: (ev: {}, reason: "backdropClick" | "escapeKeyDown") => void;
    zIndex?: number;
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
                    sx={{ zIndex: props.zIndex }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            minHeight: "20vh",
                        }}
                    >
                        {props.children}
                    </Box>
                </Drawer>
            }
        >
            <Modal
                open={props.open}
                onClose={props.onClose}
                style={{ "z-index": props.zIndex }}
            >
                <Paper
                    class={CommonStyle.FixedCenter}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
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
