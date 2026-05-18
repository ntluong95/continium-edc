import { RecordStatus } from "@prisma/client";
import { z } from "zod";

export const ZUpsertRecordValueInput = z.object({
  recordId: z.string().cuid(),
  instrumentFieldId: z.string().cuid(),
  value: z.string().max(10_000).nullable(),
  reason: z.string().max(500).optional(),
});

export const ZAddInstanceInput = z.object({
  subjectId: z.string().cuid(),
  eventId: z.string().cuid(),
  instrumentId: z.string().cuid(),
});

export const ZSetRecordStatusInput = z.object({
  recordId: z.string().cuid(),
  status: z.nativeEnum(RecordStatus),
});

export const ZSaveClinicalSurveyResponseInput = z.object({
  recordId: z.string().cuid(),
  /** Formbricks TResponseData — { [elementId]: value } */
  responsesJson: z.record(z.string(), z.unknown()),
  /** When true the record status advances to COMPLETE (if not already locked). */
  finished: z.boolean().default(false),
});
