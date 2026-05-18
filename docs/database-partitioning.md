# Database Partitioning

Continium uses native PostgreSQL declarative partitioning for two tables: `audit_log` (RANGE by time) and `RecordValue` (HASH by tenant). This doc is the single reference for working with partitioned tables — read it before creating any new migration that touches these tables.

## Strategy Summary

| Table | Strategy | Key | Rationale |
|---|---|---|---|
| `audit_log` | RANGE monthly | `occurred_at` | Enables cheap time-based pruning; partitions created by recurring job |
| `RecordValue` | HASH 16 buckets | `project_id` | Distributes large trial data by tenant; created once at table birth |

Both strategies are **declared at table creation** — converting an existing non-partitioned table requires a full data copy and is prohibitively expensive. The rule: *partition or never*.

## Helper Functions

Helper functions live in the `edc_internal` schema (installed by migration `20260430000000_partition_helpers`). They are idempotent — safe to call multiple times.

### `edc_internal.audit_create_partition(year INT, month INT)`

Creates the monthly RANGE partition `audit_log_YYYY_MM` if it does not exist.

```sql
-- Create the June 2026 partition (no-op if already exists)
SELECT edc_internal.audit_create_partition(2026, 6);
```

Called automatically by the pg-boss recurring job `audit.partition-create` on the 1st of each month, targeting 3 months ahead.

### `edc_internal.record_value_init_partitions(modulus INT)`

Creates all HASH partitions `record_value_0 .. record_value_{modulus-1}` for `RecordValue`. Call once from the P1.4 migration with `modulus = 16` (Decision D6).

```sql
-- Called from the P1.4 CREATE TABLE migration — do not call standalone
SELECT edc_internal.record_value_init_partitions(16);
```

## Checklist for Adding a New Partitioned Table

Follow this checklist every time you add a table that requires partitioning.

**1. Decide strategy before writing SQL**
- Time-series data → `PARTITION BY RANGE (timestamp_col)` with monthly or yearly granularity
- Tenant-scoped bulk data → `PARTITION BY HASH (project_id)` with a fixed modulus

**2. Add the table to the CI allowlist** (if it requires mandatory partitioning)

Edit `PARTITION_ALLOWLIST` in `packages/database/src/scripts/check-partition-allowlist.ts` and add both the Prisma model name and the SQL snake_case name.

**3. Write the migration**

Add `PARTITION BY` on the `CREATE TABLE` statement. The partition strategy must appear in the **same statement**, not a subsequent `ALTER TABLE`.

```sql
-- ✓ correct
CREATE TABLE "RecordValue" (
  "id"         TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  PRIMARY KEY ("id", "project_id")
) PARTITION BY HASH ("project_id");

-- ✗ wrong — partitioned tables cannot be converted after creation
CREATE TABLE "RecordValue" (
  "id"         TEXT NOT NULL
);
ALTER TABLE "RecordValue" ... -- this will fail
```

**4. Create initial partitions in the same migration**

For HASH: call `edc_internal.record_value_init_partitions(modulus)` immediately after `CREATE TABLE`.
For RANGE: the recurring job handles creation, but pre-create the first N months in the migration for the current + next 3 months.

**5. Run the CI linter locally before pushing**

```bash
pnpm --filter @continium/database db:partitions:lint
```

Expected output on a clean repo: `✓ Partition allowlist check passed — no violations found.`

**6. Composite primary key requirement**

PostgreSQL partitioned tables require the partition key to be part of the primary key. Plan your PKs accordingly:

```sql
-- audit_log: PK includes occurred_at (RANGE key)
PRIMARY KEY ("id", "occurred_at")

-- RecordValue: PK includes project_id (HASH key)
PRIMARY KEY ("id", "project_id")
```

## CI Enforcement

The `Partition allowlist check` step in `.github/workflows/lint.yml` runs `pnpm --filter @continium/database db:partitions:lint` on every PR. It fails if any migration creates an allowlisted table without `PARTITION BY`.

**Escape hatch:** If you intentionally create a non-partitioned table with the same name as an allowlisted table (e.g. in a test or rollback migration), add `-- partitions:skip` to the `CREATE TABLE` line:

```sql
CREATE TABLE "audit_log" ("id" TEXT) -- partitions:skip
```

## Modulus Decisions

| Table | Modulus | Rationale | Re-balance trigger |
|---|---|---|---|
| `RecordValue` | 16 | Scales to ~10M values; 16 allows future tablespace assignment per shard | >50M values or multi-region sharding (Phase 4) |

Modulus is **fixed at table creation**. Changing it requires a full table rewrite — treat it as immutable for v1.

## Future: Pruning / Archival

Partition-level pruning (dropping old `audit_log_YYYY_MM` partitions) is deferred to Phase 4 once a data-retention policy is defined. The monthly partition structure makes pruning a single `DROP TABLE audit_log_YYYY_MM` — no row-level deletes required.
