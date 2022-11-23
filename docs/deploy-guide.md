# Deployment

Fill your client information in the `.env` file.

Ensure you have `Node` and `pnpm`, do:

````
pnpm i && pnpm build
````

The final result will be placed at "dist" directory.

## Note

- The application assume it's being served under a secure context (for most browser it's localhost or HTTPS connection). You may see many errors if not.

## About API Keys...

We are working hard to provide interface to our internal services, but the "Third-party applications" are delayed to the second or the third quarter of LightStands. If you want to build a working application, send an email to LightStands support, and we can help you create new records for your new application.

Please don't use the API keys shipped in production environment (the stable version under web.lightstands.xyz and the nightly version web-nightly.lightstands.xyz), some API endpoints uses redirection to prevent attacks.
