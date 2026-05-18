import { describe, expect, test } from "vitest";
import { z } from "zod";
import { defineJob, defineJobContract, parseJobPayload } from "./define-job";

describe("defineJobContract", () => {
  test("creates a typed contract and parses valid payload", () => {
    const contract = defineJobContract(
      "survey.follow-up-response.send",
      z.object({ responseId: z.string().min(1) })
    );

    const parsed = parseJobPayload(contract, { responseId: "resp_123" });

    expect(parsed.responseId).toBe("resp_123");
  });

  test("throws when payload schema validation fails", () => {
    const contract = defineJobContract(
      "survey.follow-up-response.send",
      z.object({ responseId: z.string().min(1) })
    );

    expect(() => parseJobPayload(contract, { responseId: "" })).toThrowError();
  });
});

describe("defineJob", () => {
  test("preserves metadata and options", () => {
    const contract = defineJobContract("example.log", z.object({ message: z.string() }));

    const job = defineJob({
      contract,
      options: {
        concurrency: 2,
        defaultEnqueueOptions: {
          retryLimit: 3,
          retryDelaySeconds: 5,
          retryBackoff: true,
        },
      },
      handler: async () => {},
    });

    expect(job.contract.name).toBe("example.log");
    expect(job.options?.concurrency).toBe(2);
    expect(job.options?.defaultEnqueueOptions?.retryLimit).toBe(3);
  });
});
