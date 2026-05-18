import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * End-to-end pin for the LOCKED record contract:
 *
 *  - Write/edit on a LOCKED record is rejected by the application
 *    layer (assertCanWriteRecord throws).
 *  - The status machine enforces COMPLETE → LOCKED only (B2). Other
 *    sources cannot reach LOCKED via setRecordStatus.
 *  - The unlock path is LOCKED → INCOMPLETE only.
 *
 * The status machine itself is unit-tested in
 * record-status-machine.test.ts. This file verifies that the same
 * contract holds against a real DB and a real `assertCanWriteRecord`
 * lookup — the assertion uses `prisma.record.findUnique({ where:
 * { id }, select: { status } })`, and the integration test confirms
 * that LOCKED rows produced by Prisma create are rejected by the
 * assertion just like records produced via the action layer.
 */

const DB_URL_PRESENT = Boolean(process.env.DATABASE_URL);

describe("LOCKED record contract — end-to-end", () => {
  type PrismaSingleton = typeof import("@continium/database")["prisma"];

  let prisma: PrismaSingleton | null = null;
  let assertCanWriteRecord:
    | typeof import("@/modules/clinical/access/lib/assert-helpers")["assertCanWriteRecord"]
    | null = null;
  let canTransitionRecordStatus:
    | typeof import("@/modules/clinical/records/lib/record-status-machine")["canTransitionRecordStatus"]
    | null = null;
  let dbReachable = false;

  const PREFIX = `rec-lock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ids = {
    org: `${PREFIX}-org`,
    project: `${PREFIX}-project`,
    environment: `${PREFIX}-env`,
    study: `${PREFIX}-study`,
    arm: `${PREFIX}-arm`,
    event: `${PREFIX}-event`,
    instrument: `${PREFIX}-instrument`,
    subject: `${PREFIX}-subject`,
    recordIncomplete: `${PREFIX}-record-incomplete`,
    recordComplete: `${PREFIX}-record-complete`,
    recordLocked: `${PREFIX}-record-locked`,
  };

  const skip = () => !DB_URL_PRESENT || !dbReachable;

  beforeAll(async () => {
    if (!DB_URL_PRESENT) return;
    ({ prisma } = await import("@continium/database"));
    ({ assertCanWriteRecord } = await import(
      "@/modules/clinical/access/lib/assert-helpers"
    ));
    ({ canTransitionRecordStatus } = await import(
      "@/modules/clinical/records/lib/record-status-machine"
    ));

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReachable = true;
    } catch {
      dbReachable = false;
      return;
    }

    await prisma.organization.create({ data: { id: ids.org, name: `${PREFIX} org` } });
    await prisma.project.create({
      data: { id: ids.project, name: `${PREFIX} project`, kind: "CLINICAL", organizationId: ids.org },
    });
    await prisma.environment.create({
      data: { id: ids.environment, type: "production", projectId: ids.project },
    });
    await prisma.study.create({
      data: { id: ids.study, projectId: ids.project, name: `${PREFIX} study` },
    });
    await prisma.arm.create({
      data: { id: ids.arm, studyId: ids.study, name: "Arm 1", position: 0 },
    });
    await prisma.event.create({
      data: { id: ids.event, armId: ids.arm, name: "Visit 1", position: 0 },
    });
    await prisma.instrument.create({
      data: {
        id: ids.instrument,
        studyId: ids.study,
        name: "demographics",
        displayName: "Demographics",
        status: "PUBLISHED",
        version: 1,
        sourceSurveyHash: `${PREFIX}-hash`,
        fieldHash: `${PREFIX}-fields`,
      },
    });
    await prisma.subject.create({
      data: { id: ids.subject, studyId: ids.study, externalId: `${PREFIX}-s` },
    });
    await prisma.record.createMany({
      data: [
        {
          id: ids.recordIncomplete,
          projectId: ids.project,
          subjectId: ids.subject,
          eventId: ids.event,
          instrumentId: ids.instrument,
          instance: 1,
          status: "INCOMPLETE",
        },
        {
          id: ids.recordComplete,
          projectId: ids.project,
          subjectId: ids.subject,
          eventId: ids.event,
          instrumentId: ids.instrument,
          instance: 2,
          status: "COMPLETE",
        },
        {
          id: ids.recordLocked,
          projectId: ids.project,
          subjectId: ids.subject,
          eventId: ids.event,
          instrumentId: ids.instrument,
          instance: 3,
          status: "LOCKED",
          lockedAt: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma || !dbReachable) return;
    await prisma.record.deleteMany({ where: { id: { startsWith: PREFIX } } }).catch(() => undefined);
    await prisma.study.delete({ where: { id: ids.study } }).catch(() => undefined);
    await prisma.instrument.delete({ where: { id: ids.instrument } }).catch(() => undefined);
    await prisma.project.delete({ where: { id: ids.project } }).catch(() => undefined);
    await prisma.organization.delete({ where: { id: ids.org } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  test("assertCanWriteRecord rejects writes on a LOCKED record (before any user lookup)", async () => {
    if (skip()) return;
    if (!assertCanWriteRecord) throw new Error("setup did not run");

    // The LOCKED rejection happens before the permission lookup so any
    // userId string works here. The permission flow itself has its own
    // unit tests (rule-resolver.test.ts, assert-helpers.test.ts).
    await expect(assertCanWriteRecord("any-user-id", ids.recordLocked)).rejects.toThrow(/locked/i);
  });

  test("assertCanWriteRecord on a non-existent record throws a not-found error", async () => {
    if (skip()) return;
    if (!assertCanWriteRecord) throw new Error("setup did not run");

    await expect(assertCanWriteRecord("any-user-id", `${PREFIX}-missing`)).rejects.toThrow(/not found/i);
  });

  test("status machine rejects INCOMPLETE → LOCKED (B2 contract)", () => {
    if (!canTransitionRecordStatus) {
      // Module-load failure should not occur even without a DB; this branch
      // only triggers when DATABASE_URL is unset and the import was skipped.
      return;
    }
    expect(canTransitionRecordStatus("INCOMPLETE", "LOCKED")).toBe(false);
    expect(canTransitionRecordStatus("UNVERIFIED", "LOCKED")).toBe(false);
    expect(canTransitionRecordStatus("COMPLETE", "LOCKED")).toBe(true);
  });

  test("status machine allows the unlock path LOCKED → INCOMPLETE only", () => {
    if (!canTransitionRecordStatus) return;
    expect(canTransitionRecordStatus("LOCKED", "INCOMPLETE")).toBe(true);
    expect(canTransitionRecordStatus("LOCKED", "COMPLETE")).toBe(false);
    expect(canTransitionRecordStatus("LOCKED", "UNVERIFIED")).toBe(false);
  });

  test("a LOCKED record's lockedAt timestamp is preserved by the DB", async () => {
    if (skip()) return;
    if (!prisma) throw new Error("setup did not run");

    const row = await prisma.record.findUnique({
      where: { id: ids.recordLocked },
      select: { status: true, lockedAt: true },
    });

    expect(row?.status).toBe("LOCKED");
    expect(row?.lockedAt).toBeInstanceOf(Date);
  });
});
