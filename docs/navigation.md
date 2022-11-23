# Navigation in LightStands for Web

In general, LightStands for Web use `winodw.history.state` to determine if the window have any history to back to. This process involves `src/common/nav.ts` and `src/common/SharedAppBar.tsx`.

`nav.ts` manage the state, wrapping user state, and provide helper functions to replace some functions from `@solidjs/router`.

`SharedAppBar.tsx` determines when to show "Drawer" or "Back".
