import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@continium/database", () => ({
  prisma: {
    storageFile: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@continium/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/constants", () => ({
  NEXTAUTH_SECRET: "test-secret",
  WEBAPP_URL: "https://test.example.com",
}));

describe("saveLocalFile size cap", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  test("writes succeed when payload is under the cap", async () => {
    const { saveLocalFile, PRISMA_STORAGE_MAX_BYTES } = await import("./prisma-adapter");
    const { prisma } = await import("@continium/database");
    (prisma.storageFile.upsert as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    const data = Buffer.alloc(PRISMA_STORAGE_MAX_BYTES);
    const result = await saveLocalFile("env_1", "private", "file.bin", "application/octet-stream", data);

    expect(result.ok).toBe(true);
    expect(prisma.storageFile.upsert).toHaveBeenCalledTimes(1);
  });

  test("writes are rejected when payload exceeds the cap", async () => {
    const { saveLocalFile, PRISMA_STORAGE_MAX_BYTES } = await import("./prisma-adapter");
    const { prisma } = await import("@continium/database");

    const data = Buffer.alloc(PRISMA_STORAGE_MAX_BYTES + 1);
    const result = await saveLocalFile("env_1", "private", "file.bin", "application/octet-stream", data);

    expect(result.ok).toBe(false);
    expect(prisma.storageFile.upsert).not.toHaveBeenCalled();
  });
});
