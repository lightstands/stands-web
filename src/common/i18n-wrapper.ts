import {
    createI18nContext,
    useI18n as useI18nUnwrapped,
} from "@solid-primitives/i18n";
import { match } from "@formatjs/intl-localematcher";
import { default as rootLogger } from "../logger";
import { Accessor, createEffect, createSignal } from "solid-js";
import { settingStore, useAppSettings } from "../stores/settings";
import en_GB from "date-fns/locale/en-GB";
import { synchronised } from "./locks";

const logger = rootLogger.child({ c: "common/i18n-wrapper" });

export const SUPPORTED_LANGS = ["en", "zh-Hans"];

const DEFAULT_LANG = "en";

/**
 * Decide the using language for the user.
 * @returns the selected language tag
 */
export function autoMatchLangTag() {
    return match(
        Array.from(navigator.languages),
        SUPPORTED_LANGS,
        DEFAULT_LANG
    );
}

/**
 * A wrapper of `createI18nContext` from [@solid-primitives/i18n](https://github.com/solidjs-community/solid-primitives/tree/main/packages/i18n#readme).
 *
 * This wrapper will set the locale based on app settings and `autoMatchLangTag()` result.
 */
export function makeI18nContext(
    init?: Record<string, Record<string, unknown>>
) {
    const value = createI18nContext(init, DEFAULT_LANG);
    const locale = value[1].locale;
    const currentSettings = settingStore.get();
    if (currentSettings.appLang !== "xauto") {
        locale(currentSettings.appLang);
    } else {
        locale(autoMatchLangTag());
    }

    return value;
}

/**
 * A wrapper of `useI18n` from [@solid-primitives/i18n](https://github.com/solidjs-community/solid-primitives/tree/main/packages/i18n#readme).
 *
 * This wrapper will automatically load the string file for the current language.
 */
export function useI18n() {
    const value = useI18nUnwrapped();
    const [, { locale, add, dict }] = value;

    createEffect(() => {
        const current = locale();
        if (!dict(current)) {
            const target = `../strings/${current}.json`;
            synchronised("i18n-wrapper-load", async () => {
                if (dict(current)) return;
                await import(`../strings/${current}.json`)
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
            });
        }
    });

    return value;
}

const cachedDateFnLocale: Record<string, Locale> = {
    en_GB,
};

type TemplateFn = (
    key: string,
    params?: Record<string, any>,
    defaultValue?: string
) => string;

export function autoMatchRegion(t: TemplateFn) {
    return t("defaultRegion", undefined, "GB");
}

function getRegion(t: TemplateFn) {
    const appSettings = settingStore.get();
    if (appSettings.appRegion !== "xauto") {
        return appSettings.appRegion;
    } else {
        return autoMatchRegion(t);
    }
}

function useRegion(t: TemplateFn) {
    const appSettings = useAppSettings();
    const [region, setRegion] = createSignal(getRegion(t));
    createEffect(() => {
        if (appSettings().appRegion !== "xauto") {
            setRegion(appSettings().appRegion);
        } else {
            setRegion(autoMatchRegion(t));
        }
    });
    return region;
}

async function importDateFnLocale(tag: string): Promise<Locale> {
    switch (tag.toLowerCase()) {
        case "en-us":
            return (await import("date-fns/locale/en-US")).default;
        case "en-gb":
            return (await import("date-fns/locale/en-GB")).default;
        case "zh-cn":
            return (await import("date-fns/locale/zh-CN")).default;
        default:
            throw new TypeError(`unsupported tag "${tag}"`);
    }
}

/**
 * Get the {@link Locale} object for date-fns.
 *
 * @returns Accessor for Locale
 */
export function useDateFnLocale(): Accessor<Locale> {
    const [t, { locale }] = useI18n();
    const [dateFnLocale, setDateFnLocale] = createSignal(
        cachedDateFnLocale[locale()] ? cachedDateFnLocale[locale()] : en_GB
    );
    const region = useRegion(t);

    createEffect(() => {
        const currentLangTag = locale();
        const currentRegion = region();
        const supportedRegions = t("regions") as Record<string, string>;
        if (supportedRegions[currentRegion]) {
            const dateFnLocaleName = `${
                new Intl.Locale(currentLangTag).language
            }-${currentRegion}`;
            if (cachedDateFnLocale[dateFnLocaleName]) {
                setDateFnLocale(cachedDateFnLocale[dateFnLocaleName]);
            } else {
                synchronised("i18n-wrapper-load-date-fns-locale", async () => {
                    if (cachedDateFnLocale[dateFnLocaleName]) {
                        setDateFnLocale(cachedDateFnLocale[dateFnLocaleName]);
                        return;
                    }
                    const target = `date-fns/locale/${dateFnLocaleName}`;
                    await importDateFnLocale(dateFnLocaleName)
                        .then((mod) => {
                            cachedDateFnLocale[dateFnLocaleName] = mod;
                            setDateFnLocale(mod);
                            logger.debug({
                                act: "load-date-fns-locale",
                                target,
                                stat: "ok",
                            });
                        })
                        .catch((reason) => {
                            logger.fatal(
                                {
                                    act: "load-date-fns-locale",
                                    stat: "failed",
                                    reason,
                                    target,
                                },
                                "failed to load date-fns locale"
                            );
                        });
                });
            }
        }
    });

    return dateFnLocale;
}
