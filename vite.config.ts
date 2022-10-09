import { defineConfig, splitVendorChunkPlugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";

export default defineConfig({
    plugins: [suidPlugin(), solidPlugin(), splitVendorChunkPlugin()],
    server: {
        port: 3000,
    },
    build: {
        target: "esnext",
        sourcemap: true,
    },
});
