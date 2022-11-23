import AppBar from "@suid/material/AppBar";
import IconButton from "@suid/material/IconButton";
import Toolbar from "@suid/material/Toolbar";
import { Match, ParentComponent, Show, Switch } from "solid-js";
import { useScaffold } from "./Scaffold";
import ToolbarTitle from "./ToolbarTitle";
import {
    Menu as MenuIcon,
    ArrowBack as ArrowBackIcon,
} from "@suid/icons-material";
import { getPreviousLocation, useNavigate } from "./nav";

interface SharedAppBarProps {
    title?: string;
    forceLeftIcon?: "drawer";
}

/** Common static AppBar used across the application.
 * It must be used under Scaffold.
 */
const SharedAppBar: ParentComponent<SharedAppBarProps> = (props) => {
    const scaffoldCx = useScaffold();
    const hasPrevLoc = () => !!getPreviousLocation();
    const navigate = useNavigate();
    return (
        <AppBar position="static">
            <Toolbar>
                <Switch>
                    <Match
                        when={hasPrevLoc() && props.forceLeftIcon !== "drawer"}
                    >
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            sx={{ mr: 2 }}
                            onClick={() => navigate(-1)}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    </Match>
                    <Match when={scaffoldCx.state.drawerType === "temporary"}>
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
                    </Match>
                </Switch>

                <Show when={typeof props.title !== "undefined"}>
                    <ToolbarTitle primary={props.title!} />
                </Show>
                {props.children}
            </Toolbar>
        </AppBar>
    );
};

export default SharedAppBar;
