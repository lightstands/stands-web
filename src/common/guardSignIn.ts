import { useLocation } from "@solidjs/router";
import { createEffect } from "solid-js";
import { useSession } from "../stores/session";
import { useNavigate } from "./nav";

/**
 * Ensure user have been signed in
 */
export default function () {
    const session = useSession();
    const navigate = useNavigate();
    const loc = useLocation();

    const getJumpBackPath = () => {
        let result = loc.pathname;
        if (loc.search) {
            result += `?${loc.search}`;
        }
        if (loc.hash) {
            result += `#${loc.hash}`;
        }
        return result;
    };

    createEffect(() => {
        if (!session()) {
            navigate(`/sign-in?back=${encodeURIComponent(getJumpBackPath())}`);
        }
    });
}
