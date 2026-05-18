import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * End-to-end pin for PR 11's DAG client extension.
 *
 * The unit tests in packages/database/src/dag-middleware.test.ts
 * exercise the hook function directly. This integration test verifies
 * that the extension is actually wired into the global `prisma`
 * singleton, fires on a real query against a real Postgres, and scopes
 * Record reads correctly inside vs outside a `withDagContextAsync`
 * block.
 *
 * Setup builds a minimal clinical fixture under a unique prefix so the
 * test does not collide with seed data. Teardown deletes the Study
 * (cascades through Arms, Subjects, Enrollments, Records, DAGs) plus
 * the Instrument (Restrict FK from Record, but Records are gone by
 * then) and the Project (cascades to Environment).
 *
 * Skips cleanly when DATABASE_URL is not set or Postgres is
 * unreachable, matching the pattern in audit-log-immutability.
 */

const DB_URL_PRESENT = Boolean(process.env.DATABASE_URL);

describe("DAG isolation — Record reads scoped by withDagContextAsync", () => {
  type PrismaSingleton = typeof import("@continium/database")["prisma"];
  type WithDagContextAsyncFn = typeof import("@continium/database")["withDagContextAsync"];

  let prisma: PrismaSingleton | null = null;
  let withDagContextAsync: WithDagContextAsyncFn | null = null;
  let dbReachable = false;

  const PREFIX = `dag-iso-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ids = {
    org: `${PREFIX}-org`,
    user: `${PREFIX}-user`,
    project: `${PREFIX}-project`,
    environment: `${PREFIX}-env`,
    study: `${PREFIX}-study`,
    arm: `${PREFIX}-arm`,
    event: `${PREFIX}-event`,
    instrument: `${PREFIX}-instrument`,
    subjectA: `${PREFIX}-subject-a`,
    subjectB: `${PREFIX}-subject-b`,
    enrollmentA: `${PREFIX}-enrollment-a`,
    enrollmentB: `${PREFIX}-enrollment-b`,
    recordA: `${PREFIX}-record-a`,
    recordB: `${PREFIX}-record-b`,
    dagA: `${PREFIX}-dag-a`,
    dagB: `${PREFIX}-dag-b`,
  };

  const skip = () => !DB_URL_PRESENT || !dbReachable;

  beforeAll(async () => {
    if (!DB_URL_PRESENT) return;
    ({ prisma, withDagContextAsync } = await import("@continium/database"));

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReachable = true;
    } catch {
      dbReachable = false;
      return;
    }

    // Org + Project + Environment chain (billing relation is optional)
    await prisma.organization.create({
      data: { id: ids.org, name: `${PREFIX} org` },
    });
    await prisma.project.create({
      data: {
        id: ids.project,
        name: `${PREFIX} project`,
        kind: "CLINICAL",
        organizationId: ids.org,
      },
    });
    await prisma.environment.create({
      data: { id: ids.environment, type: "production", projectId: ids.project },
    });

    // Study + Arm + Event + Instrument
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

    // DAGs
    await prisma.dataAccessGroup.createMany({
      data: [
        { id: ids.dagA, studyId: ids.study, name: "DAG A", code: `${PREFIX}-a` },
        { id: ids.dagB, studyId: ids.study, name: "DAG B", code: `${PREFIX}-b` },
      ],
    });

    // Subjects + Enrollments (one per DAG)
    await prisma.subject.createMany({
      data: [
        { id: ids.subjectA, studyId: ids.study, externalId: `${PREFIX}-sa` },
        { id: ids.subjectB, studyId: ids.study, externalId: `${PREFIX}-sb` },
      ],
    });
    await prisma.enrollment.createMany({
      data: [
        {
          id: ids.enrollmentA,
          subjectId: ids.subjectA,
          armId: ids.arm,
          dagId: ids.dagA,
          status: "ACTIVE",
          enrolledAt: new Date(),
        },
        {
          id: ids.enrollmentB,
          subjectId: ids.subjectB,
          armId: ids.arm,
          dagId: ids.dagB,
          status: "ACTIVE",
          enrolledAt: new Date(),
        },
      ],
    });

    // Records — denormalised dagId matches the subject's enrollment
    await prisma.record.createMany({
      data: [
        {
          id: ids.recordA,
          projectId: ids.project,
          subjectId: ids.subjectA,
          eventId: ids.event,
          instrumentId: ids.instrument,
          dagId: ids.dagA,
          status: "INCOMPLETE",
        },
        {
          id: ids.recordB,
          projectId: ids.project,
          subjectId: ids.subjectB,
          eventId: ids.event,
          instrumentId: ids.instrument,
          dagId: ids.dagB,
          status: "INCOMPLETE",
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma || !dbReachable) return;

    // Records → Subject cascade → Enrollment cascade. DAGs cascade from Study.
    // Instruments + Events + Arms cascade from Study. Project cascades to Environment.
    await prisma.record.deleteMany({ where: { id: { startsWith: PREFIX } } }).catch(() => undefined);
    await prisma.study.delete({ where: { id: ids.study } }).catch(() => undefined);
    await prisma.instrument.delete({ where: { id: ids.instrument } }).catch(() => undefined);
    await prisma.project.delete({ where: { id: ids.project } }).catch(() => undefined);
    await prisma.organization.delete({ where: { id: ids.org } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  test("seed inserted both records", async () => {
    if (skip()) return;
    if (!prisma) throw new Error("setup did not run");

    const count = await prisma.record.count({ where: { projectId: ids.project } });
    expect(count).toBe(2);
  });

  test("outside withDagContextAsync, both records are visible", async () => {
    if (skip()) return;
    if (!prisma) throw new Error("setup did not run");

    const all = await prisma.record.findMany({
      where: { projectId: ids.project },
      orderBy: { id: "asc" },
      select: { id: true, dagId: true },
    });

    expect(all.map((r) => r.dagId).sort()).toEqual([ids.dagA, ids.dagB].sort());
  });

  test("inside withDagContextAsync({ userDagIds: [dagA] }), only dagA record is visible", async () => {
    if (skip()) return;
    if (!prisma || !withDagContextAsync) throw new Error("setup did not run");

    const visible = await withDagContextAsync(
      { userDagIds: [ids.dagA], bypass: false },
      async () => prisma!.record.findMany({ where: { projectId: ids.project }, select: { id: true, dagId: true } })
    );

    expect(visible).toHaveLength(1);
    expect(visible[0]?.dagId).toBe(ids.dagA);
  });

  test("empty userDagIds returns zero records (deny-by-default)", async () => {
    if (skip()) return;
    if (!prisma || !withDagContextAsync) throw new Error("setup did not run");

    const visible = await withDagContextAsync(
      { userDagIds: [], bypass: false },
      async () => prisma!.record.findMany({ where: { projectId: ids.project } })
    );

    expect(visible).toEqual([]);
  });

  test("bypass: true restores full visibility (admin path)", async () => {
    if (skip()) return;
    if (!prisma || !withDagContextAsync) throw new Error("setup did not run");

    const visible = await withDagContextAsync(
      { userDagIds: ["only-this"], bypass: true },
      async () => prisma!.record.findMany({ where: { projectId: ids.project } })
    );

    expect(visible).toHaveLength(2);
  });

  test("a caller-supplied dagId in where is overridden by the scoped filter", async () => {
    if (skip()) return;
    if (!prisma || !withDagContextAsync) throw new Error("setup did not run");

    // Defence in depth: cannot widen scope by passing a different dagId.
    const visible = await withDagContextAsync(
      { userDagIds: [ids.dagA], bypass: false },
      async () =>
        prisma!.record.findMany({
          where: { projectId: ids.project, dagId: ids.dagB },
          select: { id: true, dagId: true },
        })
    );

    // The extension's dagId IN [dagA] wins over the caller's dagId = dagB.
    expect(visible).toHaveLength(1);
    expect(visible[0]?.dagId).toBe(ids.dagA);
  });

  test("Enrollment reads are scoped the same way", async () => {
    if (skip()) return;
    if (!prisma || !withDagContextAsync) throw new Error("setup did not run");

    const visible = await withDagContextAsync(
      { userDagIds: [ids.dagA], bypass: false },
      async () =>
        prisma!.enrollment.findMany({
          where: { subjectId: { in: [ids.subjectA, ids.subjectB] } },
          select: { id: true, dagId: true },
        })
    );

    expect(visible).toHaveLength(1);
    expect(visible[0]?.dagId).toBe(ids.dagA);
  });
});
