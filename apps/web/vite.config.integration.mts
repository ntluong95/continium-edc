// Integration-test runner config. Picks up `*.integration.test.ts` files
// only — those are the wider-than-unit tests that may touch the database,
// exercise extended scenario coverage, or take meaningfully longer to run
// than the unit suite. The default `pnpm test` config excludes them so
// unit feedback stays under a couple of seconds; CI splits them into a
// dedicated job that brings up a real Postgres.
import react from "@vitejs/plugin-react";
import { PluginOption, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    include: ["**/*.integration.test.ts", "**/*.integration.test.tsx"],
    exclude: ["playwright/**", "node_modules/**", ".next/**"],
    // Integration tests need a real Prisma client + real constants — see
    // vitestSetup.integration.ts for why the unit setup is unsuitable.
    setupFiles: ["./vitestSetup.integration.ts"],
    env: loadEnv("", process.cwd(), ""),
    // Integration tests usually depend on DB state being clean and may
    // hold locks; serialise them by default.
    fileParallelism: false,
    testTimeout: 30_000,
  },
  plugins: [tsconfigPaths(), react() as PluginOption],
});
