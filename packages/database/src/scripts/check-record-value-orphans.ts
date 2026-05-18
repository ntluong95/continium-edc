/**
 * Operational consistency check for `record_value` rows.
 *
 * `RecordValue` is hash-partitioned by `project_id`, which means Prisma
 * cannot declare a foreign key from `record_value.record_id` to
 * `record.id`. Without that FK, a delete on `record` will not cascade
 * to `record_value`, and the application is responsible for keeping
 * the two tables in sync. This script lets ops / CI verify the
 * invariant out-of-band.
 *
 * Exits non-zero (1) when orphans are found so the script can drive a
 * cron-style alert or a CI job. Counts are printed per partition so a
 * spike is easy to localise.
 *
 * Usage:
 *   pnpm db:check:record-value-orphans
 *   tsx src/scripts/check-record-value-orphans.ts
 */
import { PrismaClient } from "@prisma/client";

type OrphanRow = { partition: string; orphan_count: bigint };

const main = async (): Promise<void> => {
  const prisma = new PrismaClient();
  try {
    // Query the parent table — Postgres will scan every partition on
    // its own. The aggregate is keyed on the relname of the actual
    // partition so the report tells you which hash bucket holds the
    // drift, which is the unit ops will need to investigate.
    const rows = await prisma.$queryRaw<OrphanRow[]>`
      SELECT
        c.relname::text AS partition,
        COUNT(*)::bigint AS orphan_count
      FROM "RecordValue" rv
      JOIN pg_catalog.pg_class c ON c.oid = rv.tableoid
      LEFT JOIN "record" r ON r.id = rv.record_id
      WHERE r.id IS NULL
      GROUP BY c.relname
      ORDER BY c.relname;
    `;

    if (rows.length === 0) {
      console.log("record_value orphan check: OK (0 orphans across all partitions).");
      return;
    }

    const total = rows.reduce((acc, row) => acc + Number(row.orphan_count), 0);
    console.error(`record_value orphan check: FAIL (${total} orphan rows).`);
    for (const row of rows) {
      console.error(`  - ${row.partition}: ${row.orphan_count} orphan(s)`);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error("record_value orphan check failed to run:", error);
  process.exit(2);
});
