import { Box, Drawer, Modal, Paper, useTheme } from "@suid/material";
import { ParentComponent, Show } from "solid-js";

import { useScaffold } from "./Scaffold";
import CommonStyle from "./Style.module.css";

interface BottomSheetProps {
    open: boolean;
    onClose?: (ev: {}, reason: "backdropClick" | "escapeKeyDown") => void;
}

const BottomSheet: ParentComponent<BottomSheetProps> = (props) => {
    const scaffoldCx = useScaffold();
    const theme = useTheme();
    return (
        <Show
            when={(scaffoldCx.state.width || 0) >= 772}
            fallback={
                <Drawer
                    variant="temporary"
                    anchor="bottom"
                    open={props.open}
                    onClose={props.onClose}
                    sx={{ zIndex: theme.zIndex.modal }}
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
            <Modal open={props.open} onClose={props.onClose}>
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
