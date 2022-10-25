import AppBar from "@suid/material/AppBar";
import IconButton from "@suid/material/IconButton";
import Toolbar from "@suid/material/Toolbar";
import { ParentComponent, Show } from "solid-js";
import { useScaffold } from "./Scaffold";
import ToolbarTitle from "./ToolbarTitle";
import { Menu as MenuIcon } from "@suid/icons-material";

interface SharedAppBarProps {
    title?: string;
}

/** Common static AppBar used across the application.
 * It must be used under Scaffold.
 */
const SharedAppBar: ParentComponent<SharedAppBarProps> = (props) => {
    const scaffoldCx = useScaffold();
    return (
        <AppBar position="static">
            <Toolbar>
                <Show when={scaffoldCx.state.drawerType === "temporary"}>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        sx={{ mr: 2 }}
                        onClick={() =>
                            scaffoldCx.setDrawerOpen(
                                !scaffoldCx.state.drawerOpen
                            )
                        }
                    >
                        <MenuIcon />
                    </IconButton>
                </Show>
                <Show when={typeof props.title !== "undefined"}>
                    <ToolbarTitle primary={props.title!} />
                </Show>
                {props.children}
            </Toolbar>
        </AppBar>
    );
};

export default SharedAppBar;
