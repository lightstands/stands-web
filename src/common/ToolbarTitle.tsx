import Typography from "@suid/material/Typography";
import { Component } from "solid-js";

const ToolbarTitle: Component<{ primary: string }> = (props) => {
    return (
        <Typography
            variant="h6"
            noWrap={true}
            sx={{
                flexGrow: 1,
                textOverflow: "ellipsis",
                width: "160px",
            }}
        >
            {props.primary}
        </Typography>
    );
};

export default ToolbarTitle;
