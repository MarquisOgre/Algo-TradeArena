import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Lovable's wrapper defaults to Cloudflare for its sandbox.
  // Vercel builds must emit a Vercel-compatible Nitro target.
  nitro: isVercel ? { preset: "vercel" } : true,
});
