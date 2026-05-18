import { describe, it, expect, vi, beforeEach } from "vitest";
import { PermissionDeniedError } from "./assert-helpers";

vi.mock("@continium/database", () => ({
  prisma: {
    membership: {
      findFirst: vi.fn(),
    },
    clinicalAccessRule: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    record: {
      findUnique: vi.fn(),
    },
  },
}));

describe("assert helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PermissionDeniedError", () => {
    it("should capture all relevant properties", () => {
      const error = new PermissionDeniedError(
        "Test error",
        "user-123",
        "instrument-456",
        "event-789",
        "READ"
      );

      expect(error.message).toBe("Test error");
      expect(error.userId).toBe("user-123");
      expect(error.instrumentId).toBe("instrument-456");
      expect(error.eventId).toBe("event-789");
      expect(error.requiredPermission).toBe("READ");
      expect(error.name).toBe("PermissionDeniedError");
    });
  });
});