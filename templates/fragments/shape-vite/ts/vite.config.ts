import { defineConfig } from "vite";
import { colyseus } from "colyseus/vite";

// The plugin declares a second build environment (dist/server), so every
// `vite build` builds both halves. BUILD_TARGET=client drops it when you only
// want the static client — e.g. deploying it separately from the server.
const clientOnly = process.env.BUILD_TARGET === "client";

export default defineConfig({
  build: { outDir: "dist/client" },
  plugins: [
    ...(clientOnly ? [] : [colyseus({ serverEntry: "/src/app.config.ts" })]),
  ],
});
