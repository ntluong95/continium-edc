# P0.4: Partition Migration Tooling — Delivered with Linter Enforcement

**Date**: 2026-04-28 07:40
**Severity**: Medium (preventative, not critical path)
**Component**: Database layer (`packages/database/`), CI/CD pipeline (`.github/workflows/`)
**Status**: Resolved

## What Happened

Completed P0.4 deliverable: reusable PostgreSQL partition helpers + CI enforcement to prevent future engineers from accidentally creating non-partitioned allowlisted tables (those that *must* be partitioned by architectural decision).

Successfully shipped:
- Two idempotent SQL helper functions in `edc_internal` schema: `audit_create_partition(year, month)` for `audit_log` monthly partitions and `record_value_init_partitions(modulus)` for `RecordValue` HASH partitions (16 buckets per D6)
- Migration `20260430000000_partition_helpers` applied to local DB
- CI linter (`check-partition-allowlist.ts`) that blocks migrations attempting to create allowlisted tables without `PARTITION BY` clause
- npm script `db:partitions:lint` integrated into `.github/workflows/lint.yml` as `Partition allowlist check` step
- Recipe documentation in `docs/database-partitioning.md` for future engineers
- 11/11 unit tests for the linter (all passing)

## The Brutal Truth

This took longer than it should have because of two preventable mistakes:

1. **P0.3 wasn't actually applied locally** — I'd run the migrations in my head, not in reality. Spent 30 minutes confused about why partition definitions didn't exist until `prisma migrate deploy` revealed 3 pending migrations.

2. **Code review caught critical bugs I should have caught myself:**
   - `partition-create.job.ts` was duplicating partition DDL inline instead of calling the helper function. This would cause maintenance hell: future devs would change the function but leave the job using stale DDL. Lazy copy-paste, no excuse.
   - Linter regex `audit_log` was matching child partition names like `audit_log_2026_04`, causing false negatives on legitimate child tables.
   - Lookahead window (10 lines) was too narrow for tables with many columns, causing linter to miss `PARTITION BY` statements. Arbitrary limit that didn't reflect reality.

The emotional reality: catching bugs in code review instead of in my own testing is frustrating because it means I cut corners on validation. The linter itself is solid, but the implementation details (regex tuning, edge cases) got half-baked.

## Technical Details

**SQL helpers (packages/database/sql/partitions/):**
```sql
-- audit_create_partition creates IF NOT EXISTS (idempotent)
-- Checked in smoke test: calling twice on same partition → second call silent no-op
CREATE OR REPLACE FUNCTION edc_internal.audit_create_partition(
  p_year INT,
  p_month INT
) SECURITY INVOKER ...

-- record_value_init_partitions creates 16 HASH buckets
-- Verified in pg_class: correct partition count and modulus
```

**Linter regression that failed code review:**
```typescript
// BEFORE: regex too broad
const hasPartition = /CREATE TABLE.*audit_log/i.test(migration);
// Matched: "CREATE TABLE audit_log_2026_04 PARTITION OF audit_log"

// AFTER: negative lookahead to exclude child partitions
const hasPartition = /CREATE TABLE.*audit_log(?!\w)/i.test(migration);
// Also: increased lookahead window from 10 to 30 lines + strip comments first
```

**Tests:** All 11 linter unit tests pass. Each case exercises: allowlisted table without partition (should block), allowlisted table with partition (should pass), non-allowlisted tables (should pass), edge cases (typos in `CREATE TABLE`, child partitions).

## What We Tried

1. **Initial approach:** Use `pg_partman` extension for automatic partition management. **Rejected:** YAGNI violation. We're not managing 1000s of partitions dynamically. Plain SQL functions are simpler and have no external dependency.

2. **Linter implementation v1:** Simple regex on raw migration SQL. **Failed code review:** Regex too greedy, lookahead window arbitrary, no comment handling.

3. **Linter implementation v2:** Beefed up regex with negative lookahead, increased window, added comment stripping. **Passed code review.**

## Root Cause Analysis

**Why the bugs got through:**
- No integration test before code review. I tested the linter in isolation with synthetic SQL strings, not with actual migrations from `packages/database/migrations/`.
- `partition-create.job.ts` duplication: copy-paste coding. Didn't think "where should this DDL live?" — just duplicated what worked elsewhere. Lack of architectural intent.
- Didn't simulate the actual CI workflow (`git push` → linter runs) before declaring done.

**Why P0.3 wasn't applied:** Assumed `prisma migrate deploy` had run during setup. Learned: always verify database state, don't assume.

## Lessons Learned

1. **Integration testing beats unit testing for CI enforcement tools.** Testing a linter against synthetic SQL is theater. Test it against actual migrations in your codebase, run it in the CI pipeline simulation, verify it actually blocks bad code.

2. **DRY violation: inline DDL duplication is future tech debt.** When you write SQL, ask yourself: "Will someone need to change this in six months? If yes, should it live in one place?" Yes. Functions are cheap.

3. **Regex lookahead windows should be proportional to actual code.** Arbitrary limits (10 lines) create invisible bugs. Either make the limit generous (30+), or parse properly. For future work, consider switching from regex to actual SQL parsing.

4. **Database migrations are not "tested" until they're deployed.** `prisma migrate deploy` is the source of truth. Never skip that step during implementation.

## Next Steps

1. **Code review approved.** Merge PR to `main` when ready.
2. **Monitor CI:** First 2-3 merges after this ships should trigger the linter to verify it works in live CI (should either pass legitimate code or block non-partitioned allowlisted tables).
3. **Future: Consider SQL parser for linter.** Regex is a good MVP, but if false positives/negatives accumulate, switch to proper SQL parsing (e.g., `node-sql-parser` or similar) to eliminate ambiguity.
4. **Document decision D6 (16-bucket HASH partition modulus) in `decisions/` if not already done.** Makes future audits easier.

---

**Files affected:**
- `packages/database/sql/partitions/audit_create_partition.sql`
- `packages/database/sql/partitions/record_value_init_partitions.sql`
- `packages/database/migrations/20260430000000_partition_helpers.sql`
- `.claude/linters/check-partition-allowlist.ts`
- `.github/workflows/lint.yml` (added `Partition allowlist check` step)
- `docs/database-partitioning.md` (recipe documentation)
- `partition-create.job.ts` (fixed: delegated to helper function)

**Tests: 11/11 passing.** Smoke test confirmed idempotence and correctness on local PostgreSQL.
