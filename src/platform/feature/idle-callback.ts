import { isDefined } from "./core";

export default function () {
    return (
        isDefined(window.requestIdleCallback) &&
        isDefined(window.cancelIdleCallback)
    );
}
