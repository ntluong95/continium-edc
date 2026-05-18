import { z } from "zod";

// ── Study ───────────────────────────────────────────────────────────────────

export const ZStudyUpsertInput = z.object({
  name: z.string().min(1).max(100),
  protocolId: z.string().max(100).optional(),
});

// ── Arm ────────────────────────────────────────────────────────────────────

export const ZArmCreateInput = z.object({
  studyId: z.string().cuid(),
  name: z.string().min(1).max(100),
  // position is server-assigned (count-based) — never accepted from the client
});

export const ZArmUpdateInput = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
});

export const ZArmReorderInput = z.object({
  studyId: z.string().cuid(),
  /** Ordered list of arm IDs — new positions assigned 0, 1, 2, … */
  orderedIds: z.array(z.string().cuid()).min(1),
});

export const ZArmDeleteInput = z.object({
  id: z.string().cuid(),
});

// ── Event ──────────────────────────────────────────────────────────────────

export const ZEventCreateInput = z.object({
  armId: z.string().cuid(),
  name: z.string().min(1).max(100),
  dayOffset: z.number().int().min(0).optional(),
  windowDays: z.number().int().min(0).optional(),
  // position is server-assigned (count-based) — never accepted from the client
});

export const ZEventUpdateInput = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  dayOffset: z.number().int().min(0).nullable().optional(),
  windowDays: z.number().int().min(0).nullable().optional(),
});

export const ZEventReorderInput = z.object({
  armId: z.string().cuid(),
  orderedIds: z.array(z.string().cuid()).min(1),
});

export const ZEventDeleteInput = z.object({
  id: z.string().cuid(),
});

// ── EventInstrument ────────────────────────────────────────────────────────

export const ZEventInstrumentBindInput = z.object({
  eventId: z.string().cuid(),
  instrumentId: z.string().cuid(),
  required: z.boolean().default(true),
  repeating: z.boolean().default(false),
});

export const ZEventInstrumentUnbindInput = z.object({
  eventId: z.string().cuid(),
  instrumentId: z.string().cuid(),
});

export const ZEventInstrumentBulkBindingItem = z.object({
  eventId: z.string().cuid(),
  surveyId: z.string().cuid(),
  bound: z.boolean(),
});

export const ZEventInstrumentBulkSaveInput = z.object({
  studyId: z.string().cuid(),
  armId: z.string().cuid(),
  bindings: z.array(ZEventInstrumentBulkBindingItem).max(5000),
});

export const ZEventInstrumentUpdateInput = z
  .object({
    eventId: z.string().cuid(),
    instrumentId: z.string().cuid(),
    required: z.boolean().optional(),
    repeating: z.boolean().optional(),
  })
  .refine((d) => d.required !== undefined || d.repeating !== undefined, {
    message: "At least one of required or repeating must be provided.",
  });
