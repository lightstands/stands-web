import "navigator.locks"

export async function synchronised(
    name: string,
    callback: () => Promise<void> | void
): Promise<void> {
    await navigator.locks.request(name, callback);
}
