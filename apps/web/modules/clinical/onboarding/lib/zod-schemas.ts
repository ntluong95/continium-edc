import { z } from "zod";
import { ZClinicalProjectPurpose, ZClinicalProjectStartMethod } from "./template-types";

export const ZCompleteClinicalOnboardingInput = z
  .object({
    environmentId: z.string().cuid(),
    title: z.string().trim().min(1, "Title is required").max(120),
    protocolId: z.string().trim().max(100).optional(),
    purpose: ZClinicalProjectPurpose,
    notes: z.string().trim().max(2000).optional(),
    startMethod: ZClinicalProjectStartMethod,
    templateKey: z.string().min(1).max(80).optional().nullable(),
  })
  .refine(
    (input) => input.startMethod !== "template" || (input.templateKey && input.templateKey.length > 0),
    {
      message: "templateKey is required when startMethod is 'template'",
      path: ["templateKey"],
    },
  );

export type TCompleteClinicalOnboardingInput = z.infer<typeof ZCompleteClinicalOnboardingInput>;
