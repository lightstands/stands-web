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

Register your app at https://your.lightstands.xyz/apps/new.
