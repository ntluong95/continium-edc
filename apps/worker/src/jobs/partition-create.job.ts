import { prisma } from "@continium/database";
import { defineJob, defineJobContract } from "@continium/jobs";
import { partitionCreateJobSchema } from "@continium/audit";
import { logger } from "@continium/logger";

export const partitionCreateJobContract = defineJobContract(
  "audit.partition-create",
  partitionCreateJobSchema
);

/**
 * Creates the audit_log partition for the given month if it does not exist.
 * Delegates to edc_internal.audit_create_partition() — the single source of
 * truth for partition DDL (installed by migration 20260430000000_partition_helpers).
 *
 * Idempotent — the SQL function's pg_class guard makes repeated calls a no-op.
 *
 * Scheduled monthly via the cron pattern "0 0 1 * *" (midnight on the 1st).
 * The cron job always targets 3 months ahead so partitions are ready before data arrives.
 *
 * Example payload: { yearMonth: "2026-08" }
 */
export const partitionCreateJob = defineJob({
  contract: partitionCreateJobContract,
  handler: async (payload) => {
    // Default to 3 months ahead of now when called from cron (no payload).
    const targetMonth = payload.yearMonth ?? (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      return `${d.getUTCFullYear().toString()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    })();

    const [yearStr, monthStr] = targetMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-based

    const partitionName = `audit_log_${yearStr}_${monthStr}`;

    // Delegate to the edc_internal helper — parameterized to prevent injection.
    // year and month are safe integers from parseInt(), not user input.
    await prisma.$executeRaw`SELECT edc_internal.audit_create_partition(${year}::int, ${month}::int)`;

    logger.info({ partitionName }, "audit_log partition ensured");
  },
});
