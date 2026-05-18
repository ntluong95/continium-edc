import { EnrollmentStatus } from "@prisma/client";
import { z } from "zod";

export const ZCreateSubjectInput = z.object({
  externalId: z.string().trim().min(1).max(120),
  armId: z.string().cuid(),
  dagId: z.string().cuid().nullable().optional(),
  contactId: z.string().cuid().nullable().optional(),
});

export const ZLinkSubjectContactInput = z.object({
  subjectId: z.string().cuid(),
  contactId: z.string().cuid().nullable(),
});

export const ZEnrollmentActionInput = z.object({
  enrollmentId: z.string().cuid(),
});

export const ZEnrollmentTransitionInput = z.object({
  enrollmentId: z.string().cuid(),
  toStatus: z.nativeEnum(EnrollmentStatus),
  reason: z.string().trim().max(500).optional(),
}).superRefine((value, ctx) => {
  if (
    (value.toStatus === EnrollmentStatus.SCREEN_FAIL ||
      value.toStatus === EnrollmentStatus.WITHDRAWN) &&
    !value.reason?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Reason is required for this status transition.",
      path: ["reason"],
    });
  }
});
