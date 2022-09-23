import { defineConfig, splitVendorChunkPlugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";

export default defineConfig({
    plugins: [suidPlugin(), solidPlugin(), splitVendorChunkPlugin()],
    optimizeDeps: {
        exclude: ["@suid/material", "@suid/icons-material"], // workaround to vite-plugin-solid@2.3.3,2.3.5,2.3.6 breaking change
    },
    server: {
        port: 3000,
    },
    build: {
        target: "esnext",
        sourcemap: true,
    },
});
