import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      server: {
        entry: "server",
      },
    }),
    nitro(isVercel ? { preset: "vercel" } : {}),
    viteReact(),
  ],
});
