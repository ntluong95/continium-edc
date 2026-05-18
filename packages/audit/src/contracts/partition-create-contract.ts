import { z } from "zod";

/** Job payload for pre-creating the next monthly audit_log partition. */
export const partitionCreateJobSchema = z.object({
  /**
   * Target month in YYYY-MM format, e.g. "2026-08".
   * When omitted (cron invocation), the handler defaults to 3 months ahead of now.
   */
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be YYYY-MM format (e.g. 2026-08)").optional(),
});

export type TPartitionCreateJobPayload = z.infer<typeof partitionCreateJobSchema>;
