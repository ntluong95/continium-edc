# Audit Log Skeleton Implementation (Phase 0.2)

**Date**: 2026-04-27 07:30
**Status**: Complete
**Severity**: High (audit foundation)
**Component**: packages/audit, packages/database, worker jobs

## Context

Phase 0.2: Build immutable audit log foundation with zero cross-package deps. Zero-customer impact (internal plumbing). Commit: `d3b26af7`

## What Happened

Shipped working audit skeleton: AuditLog model + 5-file audit package + worker jobs + partition DDL migration.

**Implemented:**
- `packages/audit/` (5 files): types, AsyncLocalStorage context, computeDiff(), Prisma middleware, Zod contracts
- 16KB diff cap (Buffer.byteLength for UTF-8, not UTF-16)
- AuditLog composite PK (id, occurred_at) + PostgreSQL RANGE partitioning
- Fire-and-forget middleware; skips AuditLog itself (prevent loop)
- audit-write.job.ts (idempotent INSERT ON CONFLICT)
- partition-create.job.ts + monthly cron
- 15 tests, 88% coverage, all passing

## Key Decisions

| Decision | Reasoning |
|----------|-----------|
| Composite PK (id, occurred_at) | PostgreSQL RANGE partitioning requires partition key in PK |
| Zero deps in audit package | Injected write fn by caller; blocks circular deps early |
| Buffer.byteLength("utf8") for cap | JSON.length undercounts multibyte (CJK, emoji, clinical accents) |
| (client as any).$use() cast | Prisma v6 deprecates $use; $extends migration deferred to P4 |
| Zod v4 contract: z.record(z.string(), z.unknown()) | Silent breaking change from v3 — no 2-arg form |
| Fire-and-forget middleware pattern | Audit writes async; don't block Prisma operations |

## Gotchas & Lessons

1. **pg-boss queue timing**: createQueue() must precede work() registration. Prior "Queue does not exist" error (fixed in P0.1) — caught this early.
2. **Prisma partitioned PK**: Single-column PK breaks RANGE partitioning. Took first design iteration to realize.
3. **Zod v4 silent breaking**: z.record() now requires exactly 2 type args. v3 accepted 1. No error, just different behavior.
4. **UTF-8 byte counting**: Clinical data (accented chars, CJK) means multibyte strings. Buffer.byteLength("utf8") is correct; .length is not.
5. **Circular dep landmine**: Audit ← Database ← Jobs forms a triangle if audit imports Prisma types. Breaking it at the boundary (inject write fn) is critical.

## Deferred (Intentional)

- **M2**: z.nativeEnum(AuditEvent) in job schema (stricter typing)
- **M3**: PHI redaction allowlist in diff.ts (sensitive field masking)
- **L1**: withAuditContext() call sites in apps/web (HTTP layer plumbing)
- **L2**: no-restricted-imports ESLint rule (enforce circular dep prevention)
- **Phase 4**: Migrate from $use to $extends (Prisma middleware API)

## Next Steps

1. **P0.3**: Audit write endpoint + HTTP context binding (apps/web)
2. **P1**: Link audit events to user identity in clinical workflows
3. **Code review**: Composite PK design + Zod v4 contract patterns
4. **Tests**: Add partition pre-creation job e2e (monthly boundary)

**Unresolved Q:**
- Should we pre-create 12 months ahead instead of 3? Trade off partition table bloat vs. surprise outages on month boundary.
