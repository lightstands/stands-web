import { memorised } from "../core";

export default memorised("prefers-color-scheme", function () {
    return window.matchMedia("(prefers-color-scheme)").media !== "not all";
});
