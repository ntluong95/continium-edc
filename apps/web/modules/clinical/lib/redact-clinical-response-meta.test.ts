import { describe, expect, test } from "vitest";
import { CLINICAL_RESPONSE_SOURCE } from "@/modules/clinical/records/lib/clinical-response-sync";
import {
  CLINICAL_PII_META_KEYS,
  redactClinicalResponseInResponse,
  redactClinicalResponseMeta,
  redactClinicalResponseMetaInResponses,
} from "./redact-clinical-response-meta";

const clinicalMeta = () => ({
  source: CLINICAL_RESPONSE_SOURCE,
  recordId: "rec_123",
  subjectId: "sub_abc",
  subjectExternalId: "SITE01-0042",
  eventId: "evt_1",
  eventName: "Visit 1",
  armId: "arm_a",
  armName: "Treatment A",
  instrumentId: "instr_1",
  instrumentName: "Demographics",
  instance: 0,
  enteredByUserId: "usr_1",
  environmentId: "env_1",
  projectId: "prj_1",
});

const surveyMeta = () => ({
  source: "link",
  url: "https://app.continium.example/s/abc",
  country: "VN",
  userAgent: { browser: "Chrome", os: "macOS" },
});

describe("redactClinicalResponseMeta", () => {
  test("strips every clinical PII key from a clinical_data_entry meta", () => {
    const redacted = redactClinicalResponseMeta(clinicalMeta());

    for (const key of CLINICAL_PII_META_KEYS) {
      expect(redacted, `expected ${key} to be stripped`).not.toHaveProperty(key);
    }
  });

  test("preserves source, environmentId, projectId on clinical meta", () => {
    const redacted = redactClinicalResponseMeta(clinicalMeta());

    expect(redacted).toMatchObject({
      source: CLINICAL_RESPONSE_SOURCE,
      environmentId: "env_1",
      projectId: "prj_1",
    });
  });

  test("returns non-clinical meta unchanged by reference", () => {
    const input = surveyMeta();
    const redacted = redactClinicalResponseMeta(input);

    expect(redacted).toBe(input);
  });

  test("returns null and undefined unchanged", () => {
    expect(redactClinicalResponseMeta(null)).toBeNull();
    expect(redactClinicalResponseMeta(undefined)).toBeUndefined();
  });

  test("does not mutate the input object", () => {
    const input = clinicalMeta();
    const before = JSON.stringify(input);

    redactClinicalResponseMeta(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  test("ignores arrays and primitives passed in via JSON paths", () => {
    expect(redactClinicalResponseMeta([1, 2, 3] as unknown)).toEqual([1, 2, 3]);
    expect(redactClinicalResponseMeta("oops" as unknown)).toBe("oops");
    expect(redactClinicalResponseMeta(42 as unknown)).toBe(42);
  });

  test("non-clinical source value keeps clinical-looking keys intact", () => {
    const meta = { ...clinicalMeta(), source: "link" };
    const redacted = redactClinicalResponseMeta(meta);

    expect(redacted).toEqual(meta);
  });
});

describe("redactClinicalResponseMetaInResponses", () => {
  test("returns the input reference when no row is clinical", () => {
    const rows = [{ id: "r1", meta: surveyMeta() }, { id: "r2", meta: surveyMeta() }];

    expect(redactClinicalResponseMetaInResponses(rows)).toBe(rows);
  });

  test("returns a new array with only clinical rows rewritten", () => {
    const rows = [
      { id: "r1", meta: surveyMeta() },
      { id: "r2", meta: clinicalMeta() },
      { id: "r3", meta: surveyMeta() },
    ];

    const out = redactClinicalResponseMetaInResponses(rows);

    expect(out).not.toBe(rows);
    expect(out[0]).toBe(rows[0]);
    expect(out[2]).toBe(rows[2]);
    expect(out[1]).not.toBe(rows[1]);
    expect(out[1].meta).not.toHaveProperty("subjectExternalId");
    expect(out[1].meta).toMatchObject({ source: CLINICAL_RESPONSE_SOURCE });
  });

  test("tolerates rows missing the meta key", () => {
    const rows = [{ id: "r1" }, { id: "r2", meta: clinicalMeta() }];

    const out = redactClinicalResponseMetaInResponses(rows);

    expect(out[0]).toEqual({ id: "r1" });
    expect(out[1].meta).not.toHaveProperty("subjectExternalId");
  });
});

describe("redactClinicalResponseInResponse", () => {
  test("strips clinical meta on the single-row path", () => {
    const row = { id: "r1", meta: clinicalMeta() };
    const out = redactClinicalResponseInResponse(row);

    expect(out).not.toBe(row);
    expect(out.meta).not.toHaveProperty("subjectExternalId");
  });

  test("returns the same reference for survey responses", () => {
    const row = { id: "r1", meta: surveyMeta() };

    expect(redactClinicalResponseInResponse(row)).toBe(row);
  });
});
