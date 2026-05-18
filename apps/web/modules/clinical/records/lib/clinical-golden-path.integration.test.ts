import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * Golden-path integration test for the clinical dual-write contract.
 *
 * Builds the minimal Survey-linked clinical fixture and exercises
 * `upsertClinicalResponseForRecord` against a real Postgres. Verifies:
 *
 *  - First call creates exactly one Response row.
 *  - `Response.singleUseId` matches the canonical `clinical-record:<recordId>` shape.
 *  - `Record.responseId` is wired to the new Response row.
 *  - A second back-to-back call upserts the SAME Response (idempotency).
 *  - The advisory lock (`pg_advisory_xact_lock`) serialises concurrent calls
 *    so two parallel saves never produce two Response rows.
 *
 * This is the DB-level pin for PRs 2 + 3. The unit-tested contract
 * (ClinicalTx brand, withClinicalTx wrapper, response-sync hook logic)
 * holds in isolation; this file confirms it also holds against the
 * real Prisma client and real triggers/indexes.
 */

const DB_URL_PRESENT = Boolean(process.env.DATABASE_URL);

describe("clinical golden path — dual-write Record ↔ Response", () => {
  type PrismaSingleton = typeof import("@continium/database")["prisma"];
  type ResponseSyncModule = typeof import(
    "@/modules/clinical/records/lib/clinical-response-sync"
  );
  type ClinicalTxModule = typeof import("@/modules/clinical/lib/clinical-tx");

  let prisma: PrismaSingleton | null = null;
  let responseSync: ResponseSyncModule | null = null;
  let clinicalTx: ClinicalTxModule | null = null;
  let dbReachable = false;

  const PREFIX = `golden-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ids = {
    org: `${PREFIX}-org`,
    project: `${PREFIX}-project`,
    environment: `${PREFIX}-env`,
    survey: `${PREFIX}-survey`,
    study: `${PREFIX}-study`,
    arm: `${PREFIX}-arm`,
    event: `${PREFIX}-event`,
    instrument: `${PREFIX}-instrument`,
    subject: `${PREFIX}-subject`,
    record: `${PREFIX}-record`,
    user: `${PREFIX}-user`,
  };

  const skip = () => !DB_URL_PRESENT || !dbReachable;

  beforeAll(async () => {
    if (!DB_URL_PRESENT) return;
    ({ prisma } = await import("@continium/database"));
    responseSync = await import("@/modules/clinical/records/lib/clinical-response-sync");
    clinicalTx = await import("@/modules/clinical/lib/clinical-tx");

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReachable = true;
    } catch {
      dbReachable = false;
      return;
    }

    await prisma.organization.create({ data: { id: ids.org, name: `${PREFIX} org` } });
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

    // Survey is what makes the dual-write actually fire — `upsertClinicalResponseForRecord`
    // returns null for instruments without a surveyId.
    await prisma.survey.create({
      data: {
        id: ids.survey,
        name: `${PREFIX} survey`,
        type: "link",
        environmentId: ids.environment,
        status: "inProgress",
      },
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
        surveyId: ids.survey,
      },
    });
    await prisma.subject.create({
      data: { id: ids.subject, studyId: ids.study, externalId: `${PREFIX}-s` },
    });
    await prisma.record.create({
      data: {
        id: ids.record,
        projectId: ids.project,
        subjectId: ids.subject,
        eventId: ids.event,
        instrumentId: ids.instrument,
        status: "INCOMPLETE",
      },
    });
  });

  afterAll(async () => {
    if (!prisma || !dbReachable) return;
    // Response rows reference Record via record.responseId; clear that first.
    await prisma.record.deleteMany({ where: { id: { startsWith: PREFIX } } }).catch(() => undefined);
    await prisma.response.deleteMany({ where: { surveyId: ids.survey } }).catch(() => undefined);
    await prisma.study.delete({ where: { id: ids.study } }).catch(() => undefined);
    await prisma.instrument.delete({ where: { id: ids.instrument } }).catch(() => undefined);
    await prisma.survey.delete({ where: { id: ids.survey } }).catch(() => undefined);
    await prisma.project.delete({ where: { id: ids.project } }).catch(() => undefined);
    await prisma.organization.delete({ where: { id: ids.org } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  const loadRecord = async () => {
    if (!prisma || !responseSync) throw new Error("setup did not run");
    return prisma.record.findUniqueOrThrow({
      where: { id: ids.record },
      include: responseSync.clinicalResponseRecordInclude,
    });
  };

  test("first upsert creates exactly one Response with the canonical singleUseId", async () => {
    if (skip()) return;
    if (!prisma || !responseSync || !clinicalTx) throw new Error("setup did not run");

    const record = await loadRecord();
    const result = await clinicalTx.withClinicalTx((tx) =>
      responseSync.upsertClinicalResponseForRecord({
        tx,
        record,
        responseData: { q1: "yes" },
        finished: false,
        userId: ids.user,
        environmentId: ids.environment,
        projectId: ids.project,
      })
    );

    expect(result).not.toBeNull();
    expect(result?.surveyId).toBe(ids.survey);

    const responseRows = await prisma.response.findMany({ where: { surveyId: ids.survey } });
    expect(responseRows).toHaveLength(1);
    expect(responseRows[0]?.singleUseId).toBe(`clinical-record:${ids.record}`);

    const updatedRecord = await prisma.record.findUniqueOrThrow({
      where: { id: ids.record },
      select: { responseId: true },
    });
    expect(updatedRecord.responseId).toBe(responseRows[0]?.id);
  });

  test("second back-to-back upsert reuses the existing Response (idempotency)", async () => {
    if (skip()) return;
    if (!prisma || !responseSync || !clinicalTx) throw new Error("setup did not run");

    const record = await loadRecord();
    const result = await clinicalTx.withClinicalTx((tx) =>
      responseSync.upsertClinicalResponseForRecord({
        tx,
        record,
        responseData: { q1: "no" },
        finished: false,
        userId: ids.user,
        environmentId: ids.environment,
        projectId: ids.project,
      })
    );

    expect(result).not.toBeNull();

    const responseRows = await prisma.response.findMany({ where: { surveyId: ids.survey } });
    // Still exactly one row — the upsert hit the existing record path.
    expect(responseRows).toHaveLength(1);
    expect((responseRows[0]?.data as Record<string, unknown>)?.q1).toBe("no");
  });

  test("concurrent upserts produce exactly one Response (advisory lock serialises them)", async () => {
    if (skip()) return;
    if (!prisma || !responseSync || !clinicalTx) throw new Error("setup did not run");

    // Clear the Response so we start from "no row exists" — exercising the
    // race the lock is designed to prevent.
    await prisma.record.update({ where: { id: ids.record }, data: { responseId: null } });
    await prisma.response.deleteMany({ where: { surveyId: ids.survey } });

    const record = await loadRecord();
    const runOnce = (q1Value: string) =>
      clinicalTx!.withClinicalTx((tx) =>
        responseSync!.upsertClinicalResponseForRecord({
          tx,
          record,
          responseData: { q1: q1Value },
          finished: false,
          userId: ids.user,
          environmentId: ids.environment,
          projectId: ids.project,
        })
      );

    await Promise.all([runOnce("a"), runOnce("b"), runOnce("c")]);

    const responseRows = await prisma.response.findMany({ where: { surveyId: ids.survey } });
    expect(responseRows).toHaveLength(1);
  });

  test("setting finished: true marks the Response as finished and matches RecordStatus.COMPLETE semantics", async () => {
    if (skip()) return;
    if (!prisma || !responseSync || !clinicalTx) throw new Error("setup did not run");

    const record = await loadRecord();
    await clinicalTx.withClinicalTx((tx) =>
      responseSync.upsertClinicalResponseForRecord({
        tx,
        record,
        responseData: { q1: "final" },
        finished: true,
        userId: ids.user,
        environmentId: ids.environment,
        projectId: ids.project,
      })
    );

    const responseRow = await prisma.response.findFirstOrThrow({ where: { surveyId: ids.survey } });
    expect(responseRow.finished).toBe(true);
  });

  test("Response.meta preserves the clinical source marker and project/environment IDs", async () => {
    if (skip()) return;
    if (!prisma) throw new Error("setup did not run");

    const responseRow = await prisma.response.findFirstOrThrow({ where: { surveyId: ids.survey } });
    const meta = responseRow.meta as Record<string, unknown>;
    expect(meta.source).toBe("clinical_data_entry");
    expect(meta.environmentId).toBe(ids.environment);
    expect(meta.projectId).toBe(ids.project);
    expect(meta.recordId).toBe(ids.record);
    expect(meta.subjectId).toBe(ids.subject);
  });
});
