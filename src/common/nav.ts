import {
    Navigator,
    useNavigate as useNavigateOriginal,
    NavigateOptions,
    Params,
    SetParams,
    useSearchParams as useSearchParamsOriginal,
} from "@solidjs/router";

export type WrappedState<S = unknown> = {
    prevLoc: string;
    udata: S;
};

function wrapOpts<S>(
    opts: Partial<NavigateOptions<S>> | undefined,
    prevLoc: string
): Partial<NavigateOptions<WrappedState<S>>> {
    return {
        replace: opts?.replace,
        resolve: opts?.resolve,
        scroll: opts?.scroll,
        state: <WrappedState<S>>{
            prevLoc: prevLoc,
            udata: opts?.state,
        },
    };
}

export function useNavigate(): Navigator {
    const original = useNavigateOriginal();
    return (target: string | number, opts?: Partial<NavigateOptions>) => {
        if (typeof target === "number") {
            original(target);
        } else if (typeof target === "string") {
            const overridedOpts = wrapOpts(opts, window.location.href);
            original(target, overridedOpts);
        }
    };
}

export function isUsingNavProtocol(
    state: unknown
): state is WrappedState<unknown> {
    return (
        window.history.state &&
        typeof window.history.state === "object" &&
        typeof window.history.state.prevLoc === "string"
    );
}

export function getPreviousLocation(): string | undefined {
    if (isUsingNavProtocol(window.history.state)) {
        return window.history.state.prevLoc;
    }
}

export function getHistoryState(): unknown {
    if (isUsingNavProtocol(window.history.state)) {
        return window.history.state.udata;
    } else {
        return window.history.state;
    }
}

export function useSearchParams<T extends Params>(): [
    T,
    (params: SetParams, options?: Partial<NavigateOptions>) => void
] {
    const [obj, set] = useSearchParamsOriginal<T>();

    const wrappedSetParam = (
        params: SetParams,
        opts?: Partial<NavigateOptions>
    ) => {
        const prevLoc = getPreviousLocation();
        if (prevLoc) {
            const newOpts = wrapOpts(opts, prevLoc);
            set(params, newOpts);
        } else {
            set(params, opts);
        }
    };

    return [obj, wrappedSetParam];
}
