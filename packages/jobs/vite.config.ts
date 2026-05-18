/// <reference types="vitest" />
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "continiumJobs",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["pg-boss", "zod", "@continium/logger"],
    },
    emptyOutDir: false,
  },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["src/contracts/**"],
      include: ["src/**/*.ts"],
    },
  },
});
