import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TResponse } from "@continium/types/responses";

vi.mock("server-only", () => ({}));

vi.mock("@continium/database", () => ({
  prisma: {
    webhook: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@continium/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/constants", () => ({
  DANGEROUSLY_ALLOW_WEBHOOK_INTERNAL_URLS: true,
}));

vi.mock("@/lib/crypto", () => ({
  generateStandardWebhookSignature: vi.fn(
    (webhookId: string, timestamp: number) => `v1,sig-${webhookId}-${timestamp}`
  ),
}));

vi.mock("@/lib/utils/validate-webhook-url", () => ({
  validateAndResolveWebhookUrl: vi.fn(async () => null),
  createPinnedDispatcher: vi.fn(() => ({ destroy: vi.fn().mockResolvedValue(undefined) })),
}));

vi.mock("@/modules/clinical/lib/redact-clinical-response-meta", () => ({
  redactClinicalResponseInResponse: vi.fn((response) => ({
    ...response,
    meta: { source: response?.meta?.source ?? "link" },
  })),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const baseResponse = {
  id: "resp_1",
  surveyId: "svy_1",
  meta: { source: "clinical_data_entry", subjectExternalId: "SITE01-0042" },
  data: { q1: "yes" },
} as unknown as TResponse;

describe("dispatchPipelineWebhooks", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("fires POST to every matching webhook with redacted meta", async () => {
    const { dispatchPipelineWebhooks } = await import("./webhook-dispatch");
    const { prisma } = await import("@continium/database");
    (prisma.webhook.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: "wh_1", url: "https://example.com/a", secret: "s1" },
      { id: "wh_2", url: "https://example.com/b", secret: null },
    ]);

    await dispatchPipelineWebhooks({
      event: "responseCreated",
      environmentId: "env_1",
      surveyId: "svy_1",
      response: baseResponse,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    for (const call of mockFetch.mock.calls) {
      const [, init] = call;
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.event).toBe("responseCreated");
      expect(body.surveyId).toBe("svy_1");
      expect(body.data.meta).not.toHaveProperty("subjectExternalId");
    }
    const signedCall = mockFetch.mock.calls[0][1] as RequestInit;
    expect((signedCall.headers as Record<string, string>)["webhook-signature"]).toMatch(/^v1,/);
    const unsignedCall = mockFetch.mock.calls[1][1] as RequestInit;
    expect((unsignedCall.headers as Record<string, string>)["webhook-signature"]).toBeUndefined();
  });

  test("skips dispatch when no webhooks match", async () => {
    const { dispatchPipelineWebhooks } = await import("./webhook-dispatch");
    const { prisma } = await import("@continium/database");
    (prisma.webhook.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await dispatchPipelineWebhooks({
      event: "responseFinished",
      environmentId: "env_1",
      surveyId: "svy_1",
      response: baseResponse,
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("filters by environmentId, trigger, and surveyId (or empty surveyIds)", async () => {
    const { dispatchPipelineWebhooks } = await import("./webhook-dispatch");
    const { prisma } = await import("@continium/database");
    (prisma.webhook.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await dispatchPipelineWebhooks({
      event: "responseFinished",
      environmentId: "env_xyz",
      surveyId: "svy_abc",
      response: baseResponse,
    });

    expect(prisma.webhook.findMany).toHaveBeenCalledWith({
      where: {
        environmentId: "env_xyz",
        triggers: { has: "responseFinished" },
        OR: [{ surveyIds: { isEmpty: true } }, { surveyIds: { has: "svy_abc" } }],
      },
      select: { id: true, url: true, secret: true },
    });
  });

  test("one failing endpoint does not break sibling deliveries", async () => {
    const { dispatchPipelineWebhooks } = await import("./webhook-dispatch");
    const { prisma } = await import("@continium/database");
    (prisma.webhook.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: "wh_ok", url: "https://example.com/ok", secret: null },
      { id: "wh_bad", url: "https://example.com/bad", secret: null },
    ]);
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockRejectedValueOnce(new Error("connect ETIMEDOUT"));

    await dispatchPipelineWebhooks({
      event: "responseCreated",
      environmentId: "env_1",
      surveyId: "svy_1",
      response: baseResponse,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
