// Minimal setup for `*.integration.test.ts` files.
//
// The default unit setup (`./vitestSetup.ts`) mocks `@prisma/client`,
// `@/lib/constants`, `next-auth/react`, `react-hot-toast`, `next/headers`,
// `crypto.createHash`, and more — all reasonable for unit tests that
// render React or exercise pure server functions without a DB.
//
// Integration tests run against a real Postgres and a real Prisma client.
// Mocking `PrismaClient` here would defeat the point — the test would
// never hit a trigger, never see a transaction roll back, never observe
// the schema-vs-DB contract that the integration job is designed to pin.
//
// This file installs ONLY the polyfills + lifecycle hooks that are safe
// regardless of layer. Module-level mocks belong in the test file itself
// (`vi.mock(...)`), not here.
import "@testing-library/jest-dom/vitest";
import ResizeObserver from "resize-observer-polyfill";
import { afterEach, beforeEach, vi } from "vitest";

if (!global.ResizeObserver) {
  global.ResizeObserver = ResizeObserver;
}

// `server-only` is a runtime no-op stub in Next.js that throws if imported
// from a client component. Vitest's node environment is neither — stub it
// to a real no-op so server modules can be imported in integration tests
// without tripping the guard. This is the ONLY blanket mock in the
// integration setup; all other behaviour stays real (PrismaClient,
// constants, audit, etc.) so the integration tests exercise the actual
// runtime, not a thin mock layer.
vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});
