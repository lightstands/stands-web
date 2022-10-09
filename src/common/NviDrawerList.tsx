import { useLocation } from "@solidjs/router";
import List from "@suid/material/List";
import ListItem from "@suid/material/ListItem";
import ListItemButton from "@suid/material/ListItemButton";
import ListItemIcon from "@suid/material/ListItemIcon";
import { Component } from "solid-js";
import { List as ListIcon } from "@suid/icons-material";
import ListItemText from "@suid/material/ListItemText";

const NviDrawerList: Component = () => {
    const loc = useLocation();
    const pathname = () => loc.pathname;
    return (
        <List sx={{ width: "100%", height: "100%" }} disablePadding>
            <ListItem disableGutters>
                <ListItemButton>
                    <ListItemIcon>
                        <ListIcon />
                    </ListItemIcon>
                    <ListItemText primary={"Feeds"} />
                </ListItemButton>
            </ListItem>
        </List>
    );
};

export default NviDrawerList;
