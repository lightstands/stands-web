/* @refresh granular */
import { createElementSize } from "@solid-primitives/resize-observer";
import Box from "@suid/material/Box";
import Drawer from "@suid/material/Drawer";
import {
    createEffect,
    createSignal,
    ParentComponent,
    createContext,
    useContext,
} from "solid-js";
import { createStore, Store } from "solid-js/store";
import NviDrawerList from "./NviDrawerList";

interface ScaffoldProps {}

type ScaffoldState = {
    drawerType: "permanent" | "temporary";
    drawerOpen: boolean;
};

type ScaffoldContext = {
    state: Store<ScaffoldState>;
    setDrawerOpen: (nextState: boolean) => void;
};

const Cx = createContext<ScaffoldContext>();

const Scaffold: ParentComponent<ScaffoldProps> = (props) => {
    const [el, setEl] = createSignal<HTMLDivElement>();
    const [drawerOpen, setDrawerOpen] = createSignal(false);
    const [state, setState] = createStore<ScaffoldState>({
        drawerType: "temporary",
        drawerOpen: false,
    });
    const size = createElementSize(el);
    const showPermanentDrawer = () => !!(size.width && size.width > 772);
    const cx: ScaffoldContext = {
        state,
        setDrawerOpen(nextState) {
            if (!showPermanentDrawer()) {
                setDrawerOpen(nextState);
            }
        },
    };
    createEffect(() => {
        setState({ drawerOpen: drawerOpen() });
    });
    createEffect(() => {
        if (showPermanentDrawer()) {
            setState({ drawerType: "permanent" });
            setDrawerOpen(true);
        } else {
            setState({ drawerType: "temporary" });
            setDrawerOpen(false);
        }
    });
    return (
        <Cx.Provider value={cx}>
            <Box
                ref={setEl}
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100%",
                    height: "100%",
                    overflowY: "hidden",
                }}
            >
                <Drawer
                    sx={{
                        flexShrink: 0,
                        width: "240px",
                        "& .MuiDrawer-paper": {
                            width: "240px",
                            boxSizing: "border-box",
                        },
                    }}
                    anchor="left"
                    variant={state.drawerType}
                    open={drawerOpen()}
                    onClose={() => setDrawerOpen(false)}
                >
                    <NviDrawerList />
                </Drawer>
                <Box sx={{ height: "100%", flexGrow: 1 }}>{props.children}</Box>
            </Box>
        </Cx.Provider>
    );
};

export default Scaffold;

export function useScaffold(): ScaffoldContext {
    const cx = useContext(Cx);
    if (typeof cx === "undefined") {
        throw new Error("could not get parent Scaffold");
    }
    return cx;
}