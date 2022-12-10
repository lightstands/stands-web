import Typography from "@suid/material/Typography";
import { Component } from "solid-js";

const ToolbarTitle: Component<{ primary: string; color?: string }> = (
    props
) => {
    return (
        <Typography
            variant="h6"
            noWrap={true}
            sx={{
                flexGrow: 1,
                textOverflow: "ellipsis",
                width: "160px",
                color: props.color,
            }}
        >
            {props.primary}
        </Typography>
    );
};

export default ToolbarTitle;
