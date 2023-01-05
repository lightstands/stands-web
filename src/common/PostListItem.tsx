import { ListItem, ListItemText, Typography } from "@suid/material";
import { PublicPost } from "lightstands-js";
import { Switch, Match, Component } from "solid-js";

import { OpenInNew as OpenInNewIcon } from "@suid/icons-material";

import Style from "./PostListItem.module.css";
import { useNavigate } from "./nav";

interface PostListItemProps {
    metadata: PublicPost;
    feedUrlBlake3: string;
    divider?: boolean;

    "aria-posinset"?: string;
    "aria-setsize"?: string;
}

const PostListItem: Component<PostListItemProps> = (props) => {
    const navigate = useNavigate();
    const hasContent = () => props.metadata.contentTypes.length > 0;
    const hasLink = () => typeof props.metadata.link !== "undefined";
    return (
        <Switch>
            <Match when={!hasContent() && hasLink()}>
                <ListItem
                    aria-posinset={props["aria-posinset"]}
                    aria-setsize={props["aria-setsize"]}
                    tabIndex={0}
                    component="article"
                    divider={props.divider}
                    sx={{ cursor: "pointer" }}
                    data-index={props.metadata.ref}
                    onClick={() => {
                        if (
                            window.confirm(
                                `Open this link?\n\n${props.metadata.link}`
                            )
                        ) {
                            window.open(props.metadata.link, "_blank");
                        }
                    }}
                >
                    <ListItemText
                        primary={
                            <div class={Style["post-list-item-primary-title"]}>
                                <Typography>{props.metadata.title}</Typography>

                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    ({new URL(props.metadata.link!).hostname})
                                    <OpenInNewIcon fontSize="inherit" />
                                </Typography>
                            </div>
                        }
                        secondary={props.metadata.summary}
                    />
                </ListItem>
            </Match>
            <Match when={hasContent()}>
                <ListItem
                    aria-posinset={props["aria-posinset"]}
                    aria-setsize={props["aria-setsize"]}
                    tabIndex={0}
                    component="article"
                    sx={{ cursor: "pointer" }}
                    data-index={props.metadata.ref}
                    divider={props.divider}
                    onClick={() =>
                        navigate(
                            `/feeds/${props.feedUrlBlake3}/posts/${props.metadata.idBlake3}`
                        )
                    }
                >
                    <ListItemText
                        primary={props.metadata.title}
                        secondary={props.metadata.summary}
                    />
                </ListItem>
            </Match>
            <Match when={true}>
                <ListItem
                    aria-posinset={props["aria-posinset"]}
                    aria-setsise={props["aria-setsize"]}
                    tabIndex={0}
                    component="article"
                    data-index={props.metadata.ref}
                    divider={props.divider}
                >
                    <ListItemText
                        primary={props.metadata.title}
                        secondary={props.metadata.summary}
                    />
                </ListItem>
            </Match>
        </Switch>
    );
};

export default PostListItem;
