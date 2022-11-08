/* @refresh granular */
import Box from "@suid/material/Box";
import IconButton from "@suid/material/IconButton";
import {
    Accessor,
    Component,
    createUniqueId,
    For,
    JSX,
    Show,
    createContext,
    createSignal,
    Setter,
    createEffect,
    useContext,
    onMount,
    ParentComponent,
} from "solid-js";
import Style from "./Style.module.css";
import { MoreVert as MoreVertIcon } from "@suid/icons-material";
import Popover from "@suid/material/Popover";
import List from "@suid/material/List";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemText from "@suid/material/ListItemText";
import ListItemIcon from "@suid/material/ListItemIcon";
import { createStore } from "solid-js/store";

interface MenuItemRecord<C> {
    icon?: JSX.Element;
    primary: string;
    data: C;
    disabled?: boolean;
}

interface ExpandableMenuProps<C> {
    suggestWidth?: number;
    onItemClick: (data: C) => void;
    open: boolean;
    onClose: (ev: {}, reason: "backdropClick" | "escapeKeyDown") => void;
    onOpen: (e: MouseEvent) => void;
}

const MenuItemsCx = createContext<{
    items: Accessor<MenuItemRecord<unknown>[]>;
    setItems: Setter<MenuItemRecord<unknown>[]>;
}>();

export const MenuItem: Component<MenuItemRecord<unknown>> = (props) => {
    const [item, setItem] = createStore({
        ...props,
    });
    const cx = useContext(MenuItemsCx);
    createEffect(() => {
        setItem(() => {
            return {
                icon: props.icon,
                primary: props.primary,
                data: props.data,
                disabled: props.disabled,
            };
        });
    });
    onMount(() => {
        cx!.setItems((prev) => {
            prev.push(item);
            return prev;
        });
    });
    return <></>;
};

const ExpandableMenu: ParentComponent<ExpandableMenuProps<unknown>> = (
    props
) => {
    const poperId = createUniqueId();
    let buttonEl!: HTMLButtonElement;
    const [items, setItems] = createSignal<MenuItemRecord<unknown>[]>([], {
        equals: false,
    });

    const handleItemClick = (data: unknown) => {
        props.onItemClick(data);
    };

    const menuItemCx = { items, setItems };

    const expandedIconNumber = () => {
        if (props.suggestWidth) {
            return Math.min(
                items().length,
                Math.floor(props.suggestWidth / 48)
            );
        } else {
            return 0;
        }
    };

    const expandedItems = () => {
        const n = expandedIconNumber();
        return items().slice(0, n + 1);
    };

    return (
        <MenuItemsCx.Provider value={menuItemCx}>
            <Box class={/* @once */ `${Style.FlexboxRow}`}>
                <For each={expandedItems()}>
                    {(item) => {
                        return (
                            <IconButton
                                color="inherit"
                                size="large"
                                onClick={[handleItemClick, item.data]}
                                disabled={item.disabled}
                            >
                                {item.icon}
                            </IconButton>
                        );
                    }}
                </For>
                <Show when={items().length - expandedIconNumber() > 0}>
                    <IconButton
                        color="inherit"
                        size="large"
                        ref={buttonEl}
                        onClick={props.onOpen}
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Popover
                        id={poperId}
                        open={props.open}
                        anchorEl={buttonEl}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}
                        PaperProps={{ sx: { borderRadius: "2px" } }}
                        onClose={props.onClose}
                    >
                        <List disablePadding sx={{ minWidth: "160px" }}>
                            <For each={items()}>
                                {(item) => {
                                    return (
                                        <ListItemButton
                                            onClick={[
                                                handleItemClick,
                                                item.data,
                                            ]}
                                            disabled={item.disabled}
                                        >
                                            <Show
                                                when={
                                                    typeof item.icon !==
                                                    "undefined"
                                                }
                                            >
                                                <ListItemIcon>
                                                    {item.icon}
                                                </ListItemIcon>
                                            </Show>
                                            <ListItemText
                                                primary={item.primary}
                                            />
                                        </ListItemButton>
                                    );
                                }}
                            </For>
                        </List>
                    </Popover>
                </Show>
            </Box>
            {props.children}
        </MenuItemsCx.Provider>
    );
};

export default ExpandableMenu;
