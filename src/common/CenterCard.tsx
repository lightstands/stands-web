import { createMediaQuery } from "@solid-primitives/media";
import Box from "@suid/material/Box";
import Card from "@suid/material/Card";
import { ParentComponent, Show } from "solid-js";
import Style from "./CenterCard.module.css";

interface CenterCardProps {}

const CenterCard: ParentComponent<CenterCardProps> = (props) => {
    const isMidSmallerScreen = createMediaQuery("screen and (width < 600px)");
    return (
        <Box class={Style.SmartDialog}>
            <Card
                class={Style.ComfortHeader}
                elevation={isMidSmallerScreen() ? 0 : 1}
            >
                {props.children}
            </Card>
        </Box>
    );
};

export default CenterCard;
