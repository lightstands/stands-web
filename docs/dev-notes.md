# Development Notes

## Service Worker
ES module service workers does not supported in Firefox (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#browser_compatibility), so the development service worker will be failed to evalation on Firefox:

````
TypeError: ServiceWorker script at http://localhost:3000/dev-sw.js?dev-sw for scope http://localhost:3000/ threw an exception during script evaluation.
````

The only recommendation is "ignore it", use the Chromium-based browser to debug the service worker.

And most importantly, all new features should provide alternative paths without a working service worker.
