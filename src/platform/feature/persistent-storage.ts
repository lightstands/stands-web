import { isDefined } from "./core";

export default function (): boolean {
    return (
        navigator.storage &&
        isDefined(navigator.storage.persist) &&
        isDefined(navigator.storage.persisted)
    );
}
