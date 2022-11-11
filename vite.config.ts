import { defineConfig, Plugin, splitVendorChunkPlugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";
import loadVersion from "vite-plugin-package-version";

const buildTimePlugin: Plugin = {
    name: "build-time",
    config: () => {
        return {
            define: { "import.meta.env.BUILD_AT": new Date().getTime() },
        };
    },
};

export default defineConfig({
    plugins: [
        suidPlugin(),
        solidPlugin(),
        splitVendorChunkPlugin(),
        loadVersion(),
        buildTimePlugin,
    ],
    server: {
        port: 3000,
    },
    build: {
        target: "modules",
        sourcemap: true,
    },
});
