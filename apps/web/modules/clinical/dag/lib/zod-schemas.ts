import { z } from "zod";

export const ZCreateDagInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, hyphens, and underscores."),
});

export const ZUpdateDagInput = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1, "Name is required").max(100),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, hyphens, and underscores."),
});

export const ZDeleteDagInput = z.object({ id: z.string().cuid() });

export const ZAddDagMemberInput = z.object({
  dagId: z.string().cuid(),
  userId: z.string().cuid(),
});

export const ZRemoveDagMemberInput = z.object({
  dagId: z.string().cuid(),
  userId: z.string().cuid(),
});

export type TCreateDagInput = z.infer<typeof ZCreateDagInput>;
export type TUpdateDagInput = z.infer<typeof ZUpdateDagInput>;
export type TAddDagMemberInput = z.infer<typeof ZAddDagMemberInput>;
export type TRemoveDagMemberInput = z.infer<typeof ZRemoveDagMemberInput>;
