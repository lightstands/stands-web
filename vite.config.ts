import { defineConfig, splitVendorChunkPlugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";
import loadVersion from "vite-plugin-package-version";

export default defineConfig({
    plugins: [suidPlugin(), solidPlugin(), splitVendorChunkPlugin(), loadVersion()],
    server: {
        port: 3000,
    },
    build: {
        target: "esnext",
        sourcemap: true,
    },
});
