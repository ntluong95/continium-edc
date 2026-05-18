import { describe, expect, it } from "vitest";
import {
  ZArmCreateInput,
  ZArmDeleteInput,
  ZArmReorderInput,
  ZArmUpdateInput,
  ZEventCreateInput,
  ZEventDeleteInput,
  ZEventInstrumentBindInput,
  ZEventInstrumentUnbindInput,
  ZEventInstrumentUpdateInput,
  ZEventReorderInput,
  ZEventUpdateInput,
  ZStudyUpsertInput,
} from "./zod-schemas";

// ── Helpers ──────────────────────────────────────────────────────────────────
const cuid = () => "clzt0000000000000000000000";

// ── Study ────────────────────────────────────────────────────────────────────
describe("ZStudyUpsertInput", () => {
  it("accepts valid name", () => {
    expect(ZStudyUpsertInput.safeParse({ name: "Phase I" }).success).toBe(true);
  });

  it("accepts optional protocolId", () => {
    expect(ZStudyUpsertInput.safeParse({ name: "Phase I", protocolId: "P-001" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(ZStudyUpsertInput.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects name longer than 100 chars", () => {
    expect(ZStudyUpsertInput.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });
});

// ── Arm ──────────────────────────────────────────────────────────────────────
describe("ZArmCreateInput", () => {
  it("accepts valid input", () => {
    expect(ZArmCreateInput.safeParse({ studyId: cuid(), name: "Control" }).success).toBe(true);
  });

  it("rejects empty arm name", () => {
    expect(ZArmCreateInput.safeParse({ studyId: cuid(), name: "" }).success).toBe(false);
  });

  it("rejects invalid studyId", () => {
    expect(ZArmCreateInput.safeParse({ studyId: "not-a-cuid", name: "Control" }).success).toBe(false);
  });
});

describe("ZArmUpdateInput", () => {
  it("accepts valid input", () => {
    expect(ZArmUpdateInput.safeParse({ id: cuid(), name: "Treatment A" }).success).toBe(true);
  });

  it("rejects missing name", () => {
    expect(ZArmUpdateInput.safeParse({ id: cuid() }).success).toBe(false);
  });
});

describe("ZArmReorderInput", () => {
  it("accepts ordered list", () => {
    expect(ZArmReorderInput.safeParse({ studyId: cuid(), orderedIds: [cuid(), cuid()] }).success).toBe(true);
  });

  it("rejects empty orderedIds", () => {
    expect(ZArmReorderInput.safeParse({ studyId: cuid(), orderedIds: [] }).success).toBe(false);
  });
});

describe("ZArmDeleteInput", () => {
  it("accepts valid cuid", () => {
    expect(ZArmDeleteInput.safeParse({ id: cuid() }).success).toBe(true);
  });

  it("rejects invalid id", () => {
    expect(ZArmDeleteInput.safeParse({ id: "bad" }).success).toBe(false);
  });
});

// ── Event ─────────────────────────────────────────────────────────────────────
describe("ZEventCreateInput", () => {
  it("accepts name + armId only", () => {
    expect(ZEventCreateInput.safeParse({ armId: cuid(), name: "Screening" }).success).toBe(true);
  });

  it("accepts with dayOffset and windowDays", () => {
    expect(
      ZEventCreateInput.safeParse({ armId: cuid(), name: "Baseline", dayOffset: 0, windowDays: 3 }).success
    ).toBe(true);
  });

  it("rejects negative dayOffset", () => {
    expect(ZEventCreateInput.safeParse({ armId: cuid(), name: "V1", dayOffset: -1 }).success).toBe(false);
  });

  it("rejects negative windowDays", () => {
    expect(ZEventCreateInput.safeParse({ armId: cuid(), name: "V1", windowDays: -1 }).success).toBe(false);
  });
});

describe("ZEventUpdateInput", () => {
  it("accepts partial update", () => {
    expect(ZEventUpdateInput.safeParse({ id: cuid(), name: "Updated" }).success).toBe(true);
  });

  it("accepts nullable dayOffset (clear the value)", () => {
    expect(ZEventUpdateInput.safeParse({ id: cuid(), dayOffset: null }).success).toBe(true);
  });

  it("accepts nullable windowDays", () => {
    expect(ZEventUpdateInput.safeParse({ id: cuid(), windowDays: null }).success).toBe(true);
  });
});

describe("ZEventDeleteInput", () => {
  it("accepts valid cuid", () => {
    expect(ZEventDeleteInput.safeParse({ id: cuid() }).success).toBe(true);
  });
});

describe("ZEventReorderInput", () => {
  it("accepts ordered event ids", () => {
    expect(ZEventReorderInput.safeParse({ armId: cuid(), orderedIds: [cuid()] }).success).toBe(true);
  });

  it("rejects empty orderedIds", () => {
    expect(ZEventReorderInput.safeParse({ armId: cuid(), orderedIds: [] }).success).toBe(false);
  });
});

// ── EventInstrument ────────────────────────────────────────────────────────
describe("ZEventInstrumentBindInput", () => {
  it("accepts valid bind with defaults", () => {
    expect(
      ZEventInstrumentBindInput.safeParse({ eventId: cuid(), instrumentId: cuid() }).success
    ).toBe(true);
  });

  it("accepts explicit required and repeating", () => {
    expect(
      ZEventInstrumentBindInput.safeParse({
        eventId: cuid(),
        instrumentId: cuid(),
        required: false,
        repeating: true,
      }).success
    ).toBe(true);
  });

  it("rejects invalid eventId", () => {
    expect(
      ZEventInstrumentBindInput.safeParse({ eventId: "bad", instrumentId: cuid() }).success
    ).toBe(false);
  });
});

describe("ZEventInstrumentUnbindInput", () => {
  it("accepts valid pair", () => {
    expect(
      ZEventInstrumentUnbindInput.safeParse({ eventId: cuid(), instrumentId: cuid() }).success
    ).toBe(true);
  });
});

describe("ZEventInstrumentUpdateInput", () => {
  it("accepts partial update with required only", () => {
    expect(
      ZEventInstrumentUpdateInput.safeParse({
        eventId: cuid(),
        instrumentId: cuid(),
        required: false,
      }).success
    ).toBe(true);
  });

  it("accepts partial update with repeating only", () => {
    expect(
      ZEventInstrumentUpdateInput.safeParse({
        eventId: cuid(),
        instrumentId: cuid(),
        repeating: true,
      }).success
    ).toBe(true);
  });

  it("accepts both flags", () => {
    expect(
      ZEventInstrumentUpdateInput.safeParse({
        eventId: cuid(),
        instrumentId: cuid(),
        required: true,
        repeating: false,
      }).success
    ).toBe(true);
  });

  it("rejects empty-body update (neither required nor repeating set)", () => {
    expect(
      ZEventInstrumentUpdateInput.safeParse({ eventId: cuid(), instrumentId: cuid() }).success
    ).toBe(false);
  });
});
