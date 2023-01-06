import {
    createI18nContext,
    useI18n as useI18nUnwrapped,
} from "@solid-primitives/i18n";
import { match } from "@formatjs/intl-localematcher";
import { default as rootLogger } from "../logger";
import { createEffect } from "solid-js";

const logger = rootLogger.child({ c: "common/i18n-wrapper" });

const SUPPORTED_LANGS = ["en", "zh-Hans"];

const DEFAULT_LANG = "en";

export function makeI18nContext(
    init?: Record<string, Record<string, unknown>>
) {
    const value = createI18nContext(init, DEFAULT_LANG);
    const locale = value[1].locale;
    locale(
        match(Array.from(navigator.languages), SUPPORTED_LANGS, DEFAULT_LANG)
    );
    return value;
}

export function useI18n() {
    const value = useI18nUnwrapped();
    const [, { locale, add, dict }] = value;

    createEffect(() => {
        const current = locale();
        if (!dict(current)) {
            const target = `../strings/${current}.json`;
            logger.trace({ act: "load", target });
            import(`../strings/${current}.json`)
                .then((mod: Record<string, any>) => {
                    add(current, mod);
                    logger.debug({ act: "load", stat: "ok", target });
                })
                .catch((reason) => {
                    logger.fatal(
                        { act: "load", stat: "failed", reason, target },
                        "failed to load language",
                        current
                    );
                });
        }
    });

    return value;
}
