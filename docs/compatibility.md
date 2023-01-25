# Compatibility

## Requirements

The support is decided by if the browser supports ES6 dynamic import.

| Browser      | Chrome | Edge               | Safari | Firefox | Opera | Safari on iOS |
|--------------|--------|--------------------|--------|---------|-------|---------------|
| Min. version | 63     | 79 (Chromium Edge) | 14     | 67      | 50    | 14            |

Internet Exproler does not support ES6 dynamic import.

Safari on macOS and iOS are being treated differently to the other softwares in the table: updating with the operating system. Rubicon decide to support the major versions which are received "security updates" within 2 years. See https://support.apple.com/en-us/HT201222 for the update log.

- Safari 14.1.2 update is at 13 Sep. 2021 and will be deprecated after 13 Sep. 2023.
- iOS 14.8 (Safari on iOS) update is at 13 Sep 2021 and will be deprecated after 13 Sep. 2023.

## Per-feature

Note. 🚫 = Not implemented, 🐛 = Bug (inclduing inconsistence).

### Grid Layout

| Feature Name           | Available | Note.                                                                                                    |
|------------------------|-----------|----------------------------------------------------------------------------------------------------------|
| `display: grid`        | Yes       |                                                                                                          |
| `grid-*` and `fr` unit | Yes       |                                                                                                          |
| `gap`                  | No        | https://caniuse.com/mdn-css_properties_gap_grid_context Chrome 66+, Opera 53+                            |
| Subgrid                | No        | https://caniuse.com/css-subgrid Chrome 🚫, Edge 🚫, Safari 16+, Firefox 71+, Opera 🚫, Safari on iOS 16+ |

### Flexbox Layout

| Feature Name                                                                          | Available | Note                                                                                                             |
|---------------------------------------------------------------------------------------|-----------|------------------------------------------------------------------------------------------------------------------|
| `display: flex` and `display: inline-flex`                                            | Yes       |                                                                                                                  |
| `flex-*`, `align-content`, `align-items`, `align-self`, `justify-content` and `order` | Yes       |                                                                                                                  |
| `gap`                                                                                 | No        | https://caniuse.com/flexbox-gap Chrome 84+, Edge 84+, Safari 14.1+, Firefox 63+, Opera 70+ , Safari on iOS 14.5+ |
| Absolutely-positioned flex children                                                   | Yes       | https://developer.mozilla.org/en-US/docs/Web/CSS/position#browser_compatibility                                  |

### JavaScript Generals

| Name          | Available | Note                                                                                                                        |
|---------------|-----------|-----------------------------------------------------------------------------------------------------------------------------|
| BigInt        | No        | https://caniuse.com/bigint Chrome 67+, Firefox 68+, Opera 54+                                                               |
| BigInt64Array | No        | https://caniuse.com/mdn-javascript_builtins_bigint64array Chrome 67+, Safari 15+, Firefox 68+, Opera 54+, Safari on iOS 15+ |
| `import()`    | Yes       |                                                                                                                             |


### JavaScript `Intl`

| Name                         | Available                                                                                                | Note                                                                                                                                                            |
|------------------------------|----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Intl.getCanonicalLocales()` | Yes                                                                                                      |                                                                                                                                                                 |
| `Intl.LocaleMatcher`         | Yes (ponyfill via [@formatjs/intl-localematcher](https://formatjs.io/docs/polyfills/intl-localematcher)) | A stage-1 proposal, https://github.com/tc39/proposal-intl-localematcher, The ponyfill requires `Intl.Locale` polyfill.                                          |
| `Intl.Locale`                | Yes (polyfill via [@formatjs/intl-locale](https://formatjs.io/docs/polyfills/intl-locale))               | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale#browser_compatibility Chrome 74+, Edge 79+, Firefox 75+, Opera 62+ |

For processing about time & date, use `date-fns` package.

### CSS Generals

| Name                                              | Available                                                                                                   | Note                                                                                                             |
|---------------------------------------------------|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `position: sticky`                                | Yes                                                                                                         |                                                                                                                  |
| Table elements as `sticky` positioning containers | Yes                                                                                                         | https://developer.mozilla.org/en-US/docs/Web/CSS/position#browser_compatibility Firefox 🐛                       |
| `:focus-visible`                                  | Yes (polyfilled via postcss, postcss-preset-env and [focus-visible](https://github.com/WICG/focus-visible)) | https://caniuse.com/css-focus-visible ( Chrome 86+, Edge 86+, Safari (and on iOS) 15.4+, Firefox 85+, Opera 72+) |
| `:blank`                                          | No                                                                                                          | https://caniuse.com/mdn-css_selectors_blank (No browser implemented this feature)                                |
| `:focus-within`                                   | Yes                                                                                                         |                                                                                                                  |
| `:has()`                                          | No                                                                                                          | https://caniuse.com/css-has (Chrome 105+, Edge 105+, Safari (and on iOS) 15.4+, Firefox 🚫, Opera 91+)           |

### Media Query
| Name                   | Available                                                                     | Note                                                             |
|------------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------|
| `prefers-color-scheme` | Yes (polyfilled via postcss, postcss-preset-env and css-prefers-color-scheme) | https://caniuse.com/prefers-color-scheme (Chrome 76+, Opera 62+) |

### JavaScript DOM

| Name                                                         | Available                            | Note                                                                                                                                                                                              |
|--------------------------------------------------------------|--------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Element.prototype.classList`                                | Yes                                  |                                                                                                                                                                                                   |
| `MutationObserver`                                           | Yes                                  |                                                                                                                                                                                                   |
| `requestAnimationFrame`                                      | Yes                                  | https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#browser_compatibility                                                                                               |
| Web Locks (`LockManager.{query,request}`, `navigator.locks`) | Yes (polyfill via `navigator.locks`) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API Chrome 69+, Edge 79+, Firefox 96+, Opera 56+, Safari and Safari on iOS 15.4+. Recommend to use `synchronised` from `common/locks`. |
| StorageManager `.persist()`, `.persisted()`                  | No                                   | Safari (and on iOS) 15.2+. For the `persisted`, Recommended to use compatibility layer in `platform/perm/storage`                                                                                 |
| StorageManager `.estimate`                                   | No                                   | Safari (and on iOS) 🚫                                                                                                                                                                            |


### Web Permission API

| Name                            | Available | Note                                                                                                                                                                                                                                                                                                                                         |
|---------------------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Permission API                  | No        | https://caniuse.com/permissions-api Safari (and on iOS) 16+                                                                                                                                                                                                                                                                                  |
| `persistent-storage` permission | No        | https://caniuse.com/mdn-api_permissions_permission_persistent-storage Chrome 71+, Safari (and on iOS) 🚫, Opera 58+. Recommended to use compatibility layer in `platform/perm/storage`. The implementation in Firefox works wired: It is still "prompt" even if `StorageManager.persisted()` resolved with `true` (tested on ver.108, Linux) |
