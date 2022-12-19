import { useRegisterSW } from "virtual:pwa-register/solid";

import { default as rootLogger } from "../logger";

const logger = rootLogger.child({ c: "common/sw-bridge" });

/** This is a wrapper of `useRegisterSW` of "virtual:pwa-register/solid"
 *
 * References:
 * - https://vite-pwa-org.netlify.app/frameworks/solidjs.html
 */
export function useServiceWorker() {
    return useRegisterSW({
        onRegisteredSW() {
            logger.debug(
                {
                    act: "sw-register",
                    stat: "success",
                },
                "Service worker have been registered"
            );
        },
        onRegisterError(error) {
            logger.debug(
                {
                    act: "sw-register",
                    stat: "failed",
                    err: error,
                },
                "Service worker registration failed, error: %s",
                String(error)
            );
        },
    });
}
