import { memorised } from "../core";

export default memorised("focus-visible", () => {
    try {
        document.querySelector(":focus-visible");
    } catch {
        return false;
    }
    return true;
});
