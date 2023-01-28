import { persistentAtom } from "@nanostores/persistent";
import { action } from "nanostores";
import { v4 as uuidv4 } from "uuid";

const codeVerifierStore = persistentAtom<string>(
    "stands-web:oauth2-code-verifier",
    ""
);

export const commitCodeVerifier = action(
    codeVerifierStore,
    "commit",
    (store, codeVerifier: string) => {
        store.set(codeVerifier);
    }
);

export const clearCodeVerifier = () => commitCodeVerifier("");

export function getCodeVerifier() {
    return codeVerifierStore.get();
}

export function newCodeVerifier() {
    const val = uuidv4();
    return val;
}
