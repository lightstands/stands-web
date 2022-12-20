import { defineConfig, Plugin, splitVendorChunkPlugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";
import loadVersion from "vite-plugin-package-version";
import { VitePWA } from "vite-plugin-pwa";

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
        VitePWA({
            registerType: "prompt",
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            devOptions: {
                enabled: true,
                type: "module",
            },
            manifest: {
                name: "LightStands for Web",
                short_name: "LightStands",
                description: "LightStands application on web",
                theme_color: "#1565c0",
                icons: [
                    {
                        src: "/android-chrome-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/android-chrome-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/apple-touch-icon-180x180.png",
                        sizes: "180x180",
                        type: "image/png",
                    },
                ],
            },
        }),
    ],
    server: {
        port: 3000,
    },
    build: {
        target: "modules",
        sourcemap: true,
    },
});
