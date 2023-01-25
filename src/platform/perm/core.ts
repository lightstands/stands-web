type Observable<T> = {
    subscribe(fn: (v: T) => void): () => void;
};

export function observePermission(
    desc: PermissionDescriptor
): Observable<PermissionState> {
    return {
        subscribe(callback: (val: PermissionState) => void) {
            let queryResult: PermissionStatus | undefined;

            const onStateChanged = function (this: PermissionStatus) {
                queryResult = this;
                callback(this.state);
            };
            navigator.permissions.query(desc).then((q) => {
                onStateChanged.bind(q);
                q.addEventListener("change", onStateChanged, { passive: true });
            });

            return () => {
                if (queryResult) {
                    queryResult.removeEventListener("change", onStateChanged);
                }
            };
        },
    };
}
