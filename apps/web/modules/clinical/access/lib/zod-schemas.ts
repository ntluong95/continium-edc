import { z } from "zod";

export const ZClinicalPermission = z.enum(["NO_ACCESS", "READ", "READ_WRITE"]);

export const ZCreateClinicalAccessRule = z
  .object({
    userId: z.string().cuid2(),
    studyId: z.string().cuid2(),
    instrumentId: z.string().cuid2().optional().nullable(),
    eventId: z.string().cuid2().optional().nullable(),
    permission: ZClinicalPermission,
  })
  .refine(
    (data) => data.instrumentId || data.eventId,
    {
      message: "At least one of instrumentId or eventId must be provided",
      path: ["instrumentId"], // Or a custom path for form errors
    }
  );

export const ZUpdateClinicalAccessRule = z.object({
  id: z.string().cuid2(),
  permission: ZClinicalPermission,
});

export const ZDeleteClinicalAccessRule = z.object({
  id: z.string().cuid2(),
});

export type TClinicalPermission = z.infer<typeof ZClinicalPermission>;
export type TCreateClinicalAccessRule = z.infer<typeof ZCreateClinicalAccessRule>;
export type TUpdateClinicalAccessRule = z.infer<typeof ZUpdateClinicalAccessRule>;
export type TDeleteClinicalAccessRule = z.infer<typeof ZDeleteClinicalAccessRule>;
