import {
    createEffect,
    createSignal,
    onCleanup,
    ParentComponent,
    Show,
} from "solid-js";

interface DelayedProps {
    timeout: number;
}

/** Hide the children until timeout.
 *
 * @param props.timeout the timeout in ms
 * @param props.children the hidden elements
 */
const Delayed: ParentComponent<DelayedProps> = (props) => {
    const [isTimeout, setIsTimeout] = createSignal(false);
    let currentTimer: number | undefined = undefined;

    const cancelTimeout = () => {
        window.clearTimeout(currentTimer);
        currentTimer = undefined;
    };

    const onTimeout = () => setIsTimeout(true);

    createEffect(() => {
        if (typeof currentTimer !== "undefined") {
            cancelTimeout();
        }
        setTimeout(onTimeout, props.timeout);
    });

    onCleanup(cancelTimeout);

    return <Show when={isTimeout()}>{props.children}</Show>;
};

export default Delayed;
