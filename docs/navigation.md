# Navigation in LightStands for Web

In general, LightStands for Web use `winodw.history.state` to determine if the window have any history to back to. This process involves `src/common/nav.ts` and `src/common/SharedAppBar.tsx`.

`nav.ts` manage the state, wrapping user state, and provide helper functions to replace some functions from `@solidjs/router`.

`SharedAppBar.tsx` determines when to show "Drawer" or "Back".

## Use `a` element for external website

Though `openExternalLink` is available via `src/platform/open-url.ts` (Rubicon: I think it should be merged with `src/common/nav.ts` to `src/platform/nav.ts`), it's recommended to use `a` element and `rel="noopener"` for external website.

The `A` element provided by "@solidjs/router" must not be used to naviagte inner links. It does not and is not wrapped to pass `window.history.state`.
