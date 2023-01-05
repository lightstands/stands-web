import { AppBar, IconButton, Toolbar } from "@suid/material";
import { Match, ParentComponent, Show, Switch } from "solid-js";

import {
    Menu as MenuIcon,
    ArrowBack as ArrowBackIcon,
} from "@suid/icons-material";

import { useScaffold } from "./Scaffold";
import ToolbarTitle from "./ToolbarTitle";
import { getPreviousLocation, useNavigate } from "./nav";

interface SharedAppBarProps {
    title?: string;
    forceLeftIcon?: "drawer";
    position?: "static" | "sticky";
    hide?: boolean;
}

/** Common static AppBar used across the application.
 * It must be used under Scaffold.
 */
const SharedAppBar: ParentComponent<SharedAppBarProps> = (props) => {
    const scaffoldCx = useScaffold();
    const hasPrevLoc = () => !!getPreviousLocation();
    const navigate = useNavigate();
    return (
        <AppBar
            position={props.position || "static"}
            sx={{
                transform: props.hide ? "translateY(-100%)" : undefined,
                transition: "transform 220ms ease-in-out",
            }}
        >
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
                            aria-label="Back"
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
                            aria-label="Open drawer"
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
