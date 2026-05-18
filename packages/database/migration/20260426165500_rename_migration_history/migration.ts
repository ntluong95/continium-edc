import type { MigrationScript } from "../../src/scripts/migration-runner";

/**
 * Reconciles `_prisma_migrations.migration_name` for databases that applied the
 * original timestamp-colliding folders before they were renamed:
 *
 *   20260502000000_add_storage_file       -> 20260502000010_add_storage_file
 *   20260507000000_record_responses_json  -> 20260507000010_record_responses_json
 *
 * Without this rename the migration runner's `isSchemaMigrationApplied` check
 * misses the historical row and tries to re-apply the schema migration, which
 * fails because the table/column already exists.
 *
 * Runs early in the chain (timestamp 20260426165500, just before the drop
 * migration) and is idempotent. On a fresh DB or any DB that never had the old
 * names, both UPDATEs are no-ops.
 */
export const renameMigrationHistory: MigrationScript = {
  type: "data",
  id: "cm26renamemigrationhistory01",
  name: "20260426165500_rename_migration_history",
  run: async ({ tx }) => {
    const renames: { from: string; to: string }[] = [
      {
        from: "20260502000000_add_storage_file",
        to: "20260502000010_add_storage_file",
      },
      {
        from: "20260507000000_record_responses_json",
        to: "20260507000010_record_responses_json",
      },
    ];

    for (const { from, to } of renames) {
      // Only update when the old name exists AND the new name does not, so
      // re-runs and partial states are safe.
      await tx.$executeRaw`
        UPDATE "_prisma_migrations"
        SET "migration_name" = ${to}
        WHERE "migration_name" = ${from}
          AND NOT EXISTS (
            SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = ${to}
          )
      `;
    }
  },
};
