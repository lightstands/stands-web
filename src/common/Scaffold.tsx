/* @refresh reload */
import { createElementSize } from "@solid-primitives/resize-observer";
import { Box, Drawer } from "@suid/material";
import {
    createEffect,
    createSignal,
    ParentComponent,
    createContext,
    useContext,
} from "solid-js";
import { createStore, Store } from "solid-js/store";

import NviDrawerList from "./NviDrawerList";
import useScrollDownDetector from "./useScrollDownDetector";

interface ScaffoldProps {}

type ScaffoldState = {
    drawerType: "permanent" | "temporary";
    drawerOpen: boolean;
    width: number | null;
    height: number | null;
    suggestExpandableMenuWidth: number | null;
    scrollingDown: boolean;
};

type ScaffoldContext = {
    state: Store<ScaffoldState>;
    setDrawerOpen: (nextState: boolean) => void;
};

const Cx = createContext<ScaffoldContext>();

/* Scaffold current bulit-in tricks:
- Block swipe to back gesture on iOS 13.4+, by preventDefault on touchstart event.
*/
const Scaffold: ParentComponent<ScaffoldProps> = (props) => {
    const [el, setEl] = createSignal<HTMLDivElement>();
    const [drawerOpen, setDrawerOpen] = createSignal(false);
    const size = createElementSize(el);
    const [{ scrolling }, handleContainerScroll] = useScrollDownDetector();
    const [state, setState] = createStore<ScaffoldState>({
        drawerType: "temporary",
        drawerOpen: false,
        width: size.width,
        height: size.height,
        suggestExpandableMenuWidth: null,
        scrollingDown: false,
    });
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
    createEffect(() => {
        setState({
            width: size.width,
            height: size.height,
            suggestExpandableMenuWidth: size.width
                ? Math.floor(
                      (size.width - (showPermanentDrawer() ? 240 : 0)) * 0.3
                  )
                : null,
        });
    });
    createEffect(() => {
        setState({ scrollingDown: scrolling() });
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
                        overscrollBehavior: "contain",
                    }}
                    anchor="left"
                    variant={state.drawerType}
                    open={drawerOpen()}
                    onClose={() => setDrawerOpen(false)}
                >
                    <NviDrawerList
                        afterItemClicked={() =>
                            state.drawerType === "temporary"
                                ? setDrawerOpen(false)
                                : undefined
                        }
                        hiddenCloseItem={state.drawerType === "temporary"}
                    />
                </Drawer>
                <Box
                    sx={{ height: "100vh", flexGrow: 1, overflowY: "auto" }}
                    onScroll={handleContainerScroll}
                >
                    {props.children}
                </Box>
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
