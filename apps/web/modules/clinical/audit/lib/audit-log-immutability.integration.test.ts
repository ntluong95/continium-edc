import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * Pins the DB-level append-only contract on `audit_log` declared in
 * migration `20260427000001_audit_log_immutable`. The migration installs
 * `audit_log_no_update` and `audit_log_no_delete` triggers that raise
 * `insufficient_privilege` on any UPDATE/DELETE — including via Prisma.
 *
 * This is defence-in-depth on top of the per-role DB grants. If the
 * trigger is dropped, weakened, or shadowed by a future migration this
 * test fails loudly. Skips cleanly when DATABASE_URL is not set OR when
 * the Postgres server is unreachable, so the `pnpm test:integration`
 * run does not fail when a developer hasn't brought up the local
 * Postgres container. CI controls reachability explicitly.
 *
 * Prisma + AuditEvent are lazy-imported inside `beforeAll` so a missing
 * DATABASE_URL never reaches the Prisma client singleton (whose
 * constructor reads `process.env.DATABASE_URL`).
 */

const DB_URL_PRESENT = Boolean(process.env.DATABASE_URL);

describe("audit_log immutability triggers", () => {
  type Prisma = typeof import("@continium/database")["prisma"];
  type AuditEventEnum = typeof import("@prisma/client")["AuditEvent"];

  let prisma: Prisma | null = null;
  let AuditEvent: AuditEventEnum | null = null;
  let insertedRow: { id: string; occurredAt: Date } | null = null;
  let dbReachable = false;
  const skip = () => !DB_URL_PRESENT || !dbReachable;

  beforeAll(async () => {
    if (!DB_URL_PRESENT) return;
    ({ prisma } = await import("@continium/database"));
    ({ AuditEvent } = await import("@prisma/client"));

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReachable = true;
    } catch {
      dbReachable = false;
      return;
    }

    const actorId = `test-actor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    insertedRow = await prisma.auditLog.create({
      data: {
        event: AuditEvent.USER_LOGIN,
        actorId,
        metadata: { suite: "audit-log-immutability.integration" },
      },
      select: { id: true, occurredAt: true },
    });
  });

  afterAll(async () => {
    // Cannot DELETE the seed row — the trigger blocks it. That's the
    // contract under test. The unique actor id prevents collision with
    // production data.
    if (prisma) await prisma.$disconnect();
  });

  test("INSERT is permitted (seed row)", () => {
    if (skip()) return;
    expect(insertedRow).not.toBeNull();
  });

  test("UPDATE raises 'audit_log is append-only'", async () => {
    if (skip()) return;
    if (!prisma || !AuditEvent || !insertedRow) throw new Error("setup did not run");

    await expect(
      prisma.auditLog.update({
        where: { id_occurredAt: { id: insertedRow.id, occurredAt: insertedRow.occurredAt } },
        data: { event: AuditEvent.USER_LOGOUT },
      })
    ).rejects.toThrow(/audit_log is append-only/);
  });

  test("DELETE raises 'audit_log is append-only'", async () => {
    if (skip()) return;
    if (!prisma || !insertedRow) throw new Error("setup did not run");

    await expect(
      prisma.auditLog.delete({
        where: { id_occurredAt: { id: insertedRow.id, occurredAt: insertedRow.occurredAt } },
      })
    ).rejects.toThrow(/audit_log is append-only/);
  });

  test("Raw UPDATE via $executeRaw is also blocked (no SQL-level bypass)", async () => {
    if (skip()) return;
    if (!prisma || !insertedRow) throw new Error("setup did not run");

    await expect(
      prisma.$executeRaw`UPDATE "audit_log" SET event = 'USER_LOGOUT' WHERE id = ${insertedRow.id}`
    ).rejects.toThrow(/audit_log is append-only/);
  });
});
