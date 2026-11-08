import { defineConfig } from "vite";
export default defineConfig({
  build: { outDir: "dist/client" },
  server: { middlewareMode: true },
  appType: "custom",
});
