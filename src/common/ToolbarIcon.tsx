import IconButton from "@suid/material/IconButton";
import { JSX, ParentComponent } from "solid-js";

interface ToolbarIconProps {
    onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
    ariaLabel?: string;
    disabled?: boolean;
}

const ToolbarIcon: ParentComponent<ToolbarIconProps> = (props) => {
    return (
        <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label={props.ariaLabel}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.children}
        </IconButton>
    );
};

export default ToolbarIcon;
