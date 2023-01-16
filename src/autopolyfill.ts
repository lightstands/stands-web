import hasFocusVisible from "./platform/feature/css/focus-visible";
import hasPreferColorScheme from "./platform/feature/mediaquery/prefers-color-scheme";

import "@formatjs/intl-locale";

if (!hasFocusVisible()) {
    // @ts-ignore the script is a side-effect script
    import("focus-visible");
}

if (!hasPreferColorScheme()) {
    // @ts-ignore the module exists, vite can use it
    import("css-prefers-color-scheme/browser").then((mod) => {
        mod.default();
    });
}
