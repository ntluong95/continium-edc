# P1.1: Protocol Designer—Completion & Critical Fixes

**Date**: 2026-04-28 12:30  
**Severity**: High  
**Component**: Clinical protocol designer (Study/Arm/Event/EventInstrument schema, server actions, UI)  
**Status**: Complete  

## What Happened

Resumed Codex implementation mid-P1.1 with core schema & UI already in place but migration unapplied and tests unwritten. Completed the phase by fixing three blocking issues, writing 34 unit tests, and shipping production-ready code.

## The Brutal Truth

Codex left working but incomplete code. The migration was partially applied (hung in `_prisma_migrations` with `finished_at=null`)—would fail silently in CI. Code review exposed two HIGH-severity bugs that could corrupt data on concurrent operations and silently truncate orderings. If we'd shipped as-is, users reordering arms concurrently would lose arm positions; arm creates would occasionally deadlock or race-condition themselves. Real damage.

## Technical Details

**Migration stuck state:**
```
SELECT id, migration_name, finished_at FROM _prisma_migrations 
WHERE migration_name LIKE '20260430%';
-- 20260430000001_study_arm_event_protocol | finished_at=null (STUCK)
```

Resolved with `prisma migrate resolve --applied` then verified full schema with fresh apply.

**Bug H1—Reorder corruption:**
```typescript
// BROKEN: stale client IDs would silently corrupt sequence
await Promise.all(armIds.map((id, idx) => 
  db.arm.update({ where: { id }, data: { position: idx } })
));

// FIXED: Assert count matches before update
const count = await db.arm.count({ where: { studyId } });
if (armIds.length !== count) throw new Error("Stale arm list");
await db.$transaction(armIds.map((id, idx) => 
  db.arm.update({ where: { id }, data: { position: idx } })
));
```

**Bug H2—Concurrent create race:**
```typescript
// BROKEN: count + insert not atomic
const position = (await db.arm.count({ where: { studyId } })) + 1;
await db.arm.create({ data: { studyId, name, position } }); // ← race condition

// FIXED: count in transaction
await db.$transaction(async (tx) => {
  const count = await tx.arm.count({ where: { studyId } });
  await tx.arm.create({ data: { studyId, name, position: count } });
});
```

**Other fixes:**
- Removed client-supplied `position` from create/update input schemas (server-assigned only)
- Added `.refine()` on EventInstrument update to reject empty-body mutations
- Extracted `useActionToast` hook (was copy-pasted 3× in components)
- Added composite sort indexes: `[studyId,position]` on Arm & Event

## Root Cause Analysis

Codex didn't stress-test concurrent operations. The count→create pattern works fine for single users but fails under concurrency (classic check-then-act race). Position reorder was vulnerable to stale client data (e.g., browser cache in second tab). Both discoverable via code review + mental model of concurrent scenarios.

## Lessons Learned

1. **Concurrency is not optional**: Any count-based sequence must live inside the transaction. Test with `Promise.all()` on identical operations.
2. **Client data is always stale**: Never trust a client-supplied array of IDs for mutation. Validate count before reordering.
3. **Position field discipline**: No client `position` in create/update. Always server-assigned. Simplifies reasoning about correctness.
4. **Composite indexes earn their keep**: Sorted queries by `(studyId, position)` now use index, not table scan.

## Next Steps

- P1.2 schema ready; implementation blocked by none (start immediately if bandwidth exists)
- Monitor `position` query performance at scale with `EXPLAIN ANALYZE`
- Future: EventInstrument interim FK migrates to `instrumentId` in P1.3

---

**Commit**: `2e409b4c` (18 files, 1,701 insertions)  
**Plan Progress**: 5/11 phases (45%)  
**Shipped**: ✓ Schema, ✓ Actions (with race fixes), ✓ UI nav, ✓ Tests (34 passing)
