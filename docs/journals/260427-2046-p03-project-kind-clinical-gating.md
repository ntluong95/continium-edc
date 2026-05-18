# P0.3: ProjectKind Feature Flag & Clinical Gating Implementation Complete

**Date**: 2026-04-27 20:46
**Severity**: Medium
**Component**: Database schema, type system, clinical routing, project settings
**Status**: Resolved

## What Happened

Completed full P0.3 implementation: `ProjectKind` enum (`PRODUCT`/`CLINICAL`) as the foundation for Clinical EDC mode gating. All 4098 tests passing. Code review score 8.5/10. This is the architectural floor for everything clinical—no project can be clinical without this enum working correctly.

## The Brutal Truth

This felt straightforward on paper until we hit the `instrumentation.ts` module loading issue. The runtime module loaded instrumentation **before** the TypeScript path alias resolver was active, causing `MODULE_UNPARSABLE` errors on `@/lib/constants` imports. Feels stupid in hindsight—these early-load modules can't use aliases—but it was invisible until runtime. That's the kind of gotcha that bites you at 2am when the app won't start.

The other thing that took longer than expected: nailing down the atomic transaction for the convert-to-clinical action. We have a compliance requirement that the audit log entry **must** exist whenever the kind changes. That means if the project updates but the audit write fails, we've got a corrupted state. Had to be explicit about the `$transaction` scope and ensure both operations commit or both roll back. Small thing, but critical.

## Technical Details

**Database (Prisma):**
```prisma
enum ProjectKind {
  PRODUCT
  CLINICAL
}

model Project {
  id String @id @default(cuid())
  kind ProjectKind @default(PRODUCT)
  organizationId String
  @@index([organizationId, kind], name: "Project_organizationId_kind_idx")
}
```
- Added `ProjectKind` enum and `kind` column with `PRODUCT` default
- Composite index on `(organizationId, kind)` for clinical project queries
- Added `PROJECT_KIND_CHANGED` to `AuditEvent` enum

**Type System** (`packages/types/project.ts`):
```typescript
export const ZProjectKind = z.enum(['PRODUCT', 'CLINICAL']);
export type TProjectKind = z.infer<typeof ZProjectKind>;

export const ZProject = z.object({
  kind: ZProjectKind,
  // ... other fields
});
```
- All `selectProject` queries updated to include `kind` field
- Type guards via Zod validation, not just TypeScript narrowing

**Clinical Gating** (`apps/web/modules/clinical/assert-clinical-project.ts`):
```typescript
export function assertClinicalProject(
  project: TProject | null
): asserts project is TClinicalProject {
  if (!project || project.kind !== 'CLINICAL') {
    notFound();
  }
}
```
- Uses TypeScript assertion function pattern for compile-time narrowing
- Applied in `(app)/environments/[environmentId]/clinical/layout.tsx`
- Tests: null → `notFound()`, PRODUCT → `notFound()`, CLINICAL → passes (3/3 passing)

**Convert-to-Clinical Action** (`apps/web/actions/convert-to-clinical-action.ts`):
```typescript
const result = await prisma.$transaction(async (tx) => {
  const updated = await tx.project.update({
    where: { id: projectId },
    data: { kind: 'CLINICAL' },
    select: selectProject,
  });
  
  await tx.auditEvent.create({
    data: {
      projectId,
      eventType: 'PROJECT_KIND_CHANGED',
      actor: userId,
      changedFields: { kind: { from: 'PRODUCT', to: 'CLINICAL' } },
    },
  });
  
  return updated;
});
```
- Atomic: both update and audit write commit together or roll back together
- Returns early (idempotent) if project already `kind === 'CLINICAL'`
- Owner/manager role gating in middleware
- Loops over all environments calling `revalidatePath()` for Next.js cache invalidation

**Navigation Updates:**
- `MainNavigation.tsx`: Conditional "Clinical" link only visible when `project.kind === 'CLINICAL'`
- `EnvironmentLayout.tsx`: Passes `project.kind` to nav component
- Clinical settings card in general project settings (owner/manager only)

**Instrumentation Fix:**
Replaced `@/lib/constants` import with direct `process.env` reads in `instrumentation.ts` because Turbopack loads instrumentation before path alias resolution is available. This was blocking app startup.

## What We Tried

1. **Initial approach**: Used Zod discriminated union for kind-based type narrowing—worked but was over-engineered for a simple enum
2. **Rolled back to**: Direct `kind === 'CLINICAL'` checks with TypeScript assertion functions—cleaner, same safety
3. **Transaction approach v1**: Separate update and audit write calls—rejected, audit write could fail after update
4. **Transaction approach v2** (final): Single `$transaction` block—both operations atomic or neither happens

## Root Cause Analysis

Why the instrumentation issue wasn't caught earlier:
- Instrumentation module is loaded by Node.js runtime **before** Turbopack's middleware runs
- Path aliases resolve in the compiled JS, not at raw module load time
- Local dev worked because `next dev` loads things differently than `npm run build` + Node
- Tests didn't catch it because vitest has different module resolution

This is a **pattern issue**: any file loaded pre-middleware (instrumentation, config loaders, root-level setup) cannot use `@/` aliases. Need documentation.

## Lessons Learned

1. **Atomic operations are non-negotiable for audit logs**: If you're writing compliance events, they must be transactional with the data change. One without the other is worse than having neither. Make this a rule.

2. **Early-loading modules can't use path aliases**: Instrumentation, root config, anything Node.js touches before middleware is active must use relative or absolute imports only.

3. **Assertion functions beat runtime guards for this pattern**: The TypeScript `asserts` keyword + `is` clause lets the compiler guarantee narrowing. Cleaner than if-checks followed by type casts.

4. **Idempotency matters for state transitions**: If you're converting a project from PRODUCT→CLINICAL, handle the case where it's already CLINICAL gracefully. Return the existing state, don't error.

5. **One-way migrations in v1 are fine**: We're only supporting PRODUCT→CLINICAL now. Reverse conversion deferred to Phase 2. This keeps the initial implementation tight and lets us gather requirements first.

## Next Steps

1. **Document the path alias rule**: Add to `./docs/code-standards.md` — root modules (`instrumentation.ts`, `config/`, setup files) must use relative/absolute imports, never `@/`
2. **Phase 2 planning**: Reverse conversion (CLINICAL→PRODUCT), clinical-specific workspace UI, EDC form builder gating
3. **Monitor audit logs**: Verify every `PROJECT_KIND_CHANGED` event has matching project state in production
4. **Composite index performance**: Once clinical projects scale, verify `Project_organizationId_kind_idx` is being used correctly (run EXPLAIN ANALYZE on sample queries)

---

**Owner**: Implementation team  
**Blocked By**: None  
**Blocks**: Phase 1 (clinical form builder), Phase 2 (reverse conversion)  
**Test Coverage**: 4098/4098 passing, code review 8.5/10
