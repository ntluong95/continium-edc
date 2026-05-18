import "server-only";
import { AuditEvent, EnrollmentStatus, type Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { BYPASS_DAG_CONTEXT, type DagContext, prisma, withDagContextAsync } from "@continium/database";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { shouldEmitReadEvent } from "@/modules/clinical/audit/lib/dedupe-read-event";
import { logClinicalAuditEvent } from "./audit-events";
import { getClinicalStudyContext, getUserClinicalAccessForUser } from "./subject-access";

const CONTACT_IDENTITY_KEYS = ["firstName", "lastName", "email", "userId"] as const;

const selectContactIdentity = {
  id: true,
  attributes: {
    where: { attributeKey: { key: { in: CONTACT_IDENTITY_KEYS as unknown as string[] } } },
    select: {
      value: true,
      attributeKey: { select: { key: true } },
    },
  },
} satisfies Prisma.ContactSelect;

type TContactIdentity = Prisma.ContactGetPayload<{ select: typeof selectContactIdentity }>;

const getContactIdentityMap = (contact: TContactIdentity | null) => {
  return (contact?.attributes ?? []).reduce<Record<string, string>>((acc, attribute) => {
    acc[attribute.attributeKey.key] = attribute.value;
    return acc;
  }, {});
};

export const formatContactLabel = (contact: TContactIdentity | null) => {
  if (!contact) return null;

  const values = getContactIdentityMap(contact);
  const name = [values.firstName, values.lastName].filter(Boolean).join(" ").trim();
  return name || values.email || values.userId || contact.id;
};

export const getSubjectFormOptions = cache(async (environmentId: string) => {
  const { study } = await getClinicalStudyContext(environmentId);

  const [arms, contacts] = await Promise.all([
    prisma.arm.findMany({
      where: { studyId: study.id },
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
    prisma.contact.findMany({
      where: { environmentId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: selectContactIdentity,
    }),
  ]);

  return {
    study,
    arms,
    contacts: contacts.map((contact) => ({
      id: contact.id,
      label: formatContactLabel(contact),
    })),
  };
});

export type TSubjectFormOptions = Awaited<ReturnType<typeof getSubjectFormOptions>>;
export type TSubjectContactOption = TSubjectFormOptions["contacts"][number];

interface SubjectRosterInput {
  environmentId: string;
  page?: number;
  armId?: string;
  dagId?: string;
  status?: EnrollmentStatus;
  search?: string;
}

export const formatContactInitials = (contact: TContactIdentity | null): string | null => {
  if (!contact) return null;
  const values = getContactIdentityMap(contact);
  const first = (values.firstName?.[0] ?? "").toUpperCase();
  const last = (values.lastName?.[0] ?? "").toUpperCase();
  if (first || last) return first + last;
  const email = values.email ?? values.userId ?? contact.id;
  return email.slice(0, 2).toUpperCase();
};

export const getSubjectRoster = cache(async ({
  environmentId,
  page = 1,
  armId,
  dagId,
  status,
  search,
}: SubjectRosterInput) => {
  const { study } = await getClinicalStudyContext(environmentId);
  const skip = Math.max(0, page - 1) * ITEMS_PER_PAGE;

  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id ?? null;

  // Fetch arms and DAGs first so we know if the study uses DAGs at all.
  const [arms, dags] = await Promise.all([
    prisma.arm.findMany({
      where: { studyId: study.id },
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
    prisma.dataAccessGroup.findMany({
      where: { studyId: study.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  const studyHasDags = dags.length > 0;

  // Compute effective DAG filter based on user access level.
  // effectiveDagIds = undefined → no DAG filter (study has no DAGs or user is global admin)
  // effectiveDagIds = string[]  → restrict to these DAG IDs (empty array = no subjects visible)
  let effectiveDagIds: string[] | undefined = undefined;
  let isGlobalAdmin = true;
  let userDagIds: string[] = [];
  let dagContext: DagContext = BYPASS_DAG_CONTEXT;

  if (studyHasDags && actorId) {
    const access = await getUserClinicalAccessForUser(actorId, environmentId, study.id);
    isGlobalAdmin = access.isGlobalAdmin;
    userDagIds = access.userDagIds;

    if (!isGlobalAdmin) {
      // Restricted user: intersect requested dagId with allowed DAGs
      effectiveDagIds = dagId
        ? (userDagIds.includes(dagId) ? [dagId] : [])
        : userDagIds;
      // Extension-level scope: included Enrollment reads inside subject.findMany
      // auto-filter to the user's DAGs even when the outer manual filter
      // forgets to thread dagId through. Defence in depth.
      dagContext = { userDagIds, bypass: false };
    } else {
      // Global admin: honour explicit URL filter only
      if (dagId) effectiveDagIds = [dagId];
    }
  } else if (dagId) {
    // No DAGs in study OR no session — honour explicit URL filter for convenience
    effectiveDagIds = [dagId];
  }

  const enrollmentFilter =
    armId || status || effectiveDagIds !== undefined
      ? {
          enrollments: {
            some: {
              ...(armId ? { armId } : {}),
              ...(status ? { status } : {}),
              ...(effectiveDagIds !== undefined ? { dagId: { in: effectiveDagIds } } : {}),
            },
          },
        }
      : {};

  const where: Prisma.SubjectWhereInput = {
    studyId: study.id,
    ...(search ? { externalId: { contains: search, mode: "insensitive" as const } } : {}),
    ...enrollmentFilter,
  };

  // Study-wide (unfiltered) status counts for summary cards
  const studyBase: Prisma.SubjectWhereInput = { studyId: study.id };
  const countByStatus = (s: EnrollmentStatus) =>
    prisma.subject.count({ where: { ...studyBase, enrollments: { some: { status: s } } } });

  const rosterSubjectArgs = {
    where,
    orderBy: { createdAt: "desc" as const },
    skip,
    take: ITEMS_PER_PAGE,
    include: {
      contact: { select: selectContactIdentity },
      enrollments: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        include: {
          arm: { select: { id: true, name: true } },
          dag: { select: { id: true, name: true } },
        },
      },
    },
  } satisfies Prisma.SubjectFindManyArgs;
  type RosterSubject = Prisma.SubjectGetPayload<typeof rosterSubjectArgs>;
  type RosterPayload = {
    totalCount: number;
    subjects: RosterSubject[];
    studyTotal: number;
    activeCnt: number;
    screenedCnt: number;
    completedCnt: number;
    withdrawnCnt: number;
  };

  const loadRoster = async (): Promise<RosterPayload> => {
    const totalCount = await prisma.subject.count({ where });
    const subjects = await prisma.subject.findMany(rosterSubjectArgs);
    const studyTotal = await prisma.subject.count({ where: studyBase });
    const [activeCnt, screenedCnt, completedCnt, withdrawnCnt] = await Promise.all([
      countByStatus(EnrollmentStatus.ACTIVE),
      countByStatus(EnrollmentStatus.SCREENED),
      countByStatus(EnrollmentStatus.COMPLETED),
      countByStatus(EnrollmentStatus.WITHDRAWN),
    ]);
    return { totalCount, subjects, studyTotal, activeCnt, screenedCnt, completedCnt, withdrawnCnt };
  };

  const { totalCount, subjects, studyTotal, activeCnt, screenedCnt, completedCnt, withdrawnCnt } =
    await withDagContextAsync<RosterPayload>(dagContext, loadRoster);

  if (shouldEmitReadEvent(AuditEvent.SUBJECT_ROSTER_VIEWED, actorId, study.projectId, "Subject")) {
    void logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.SUBJECT_ROSTER_VIEWED,
      actorId,
      projectId: study.projectId,
      resourceType: "Subject",
      metadata: { page, filters: { armId, dagId, status, search } },
    });
  }

  return {
    study,
    arms,
    dags,
    isGlobalAdmin,
    userDagIds,
    page,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)),
    statusCounts: {
      total: studyTotal,
      active: activeCnt,
      screened: screenedCnt,
      completed: completedCnt,
      withdrawn: withdrawnCnt,
    },
    subjects: (subjects as RosterSubject[]).map((subject) => ({
      id: subject.id,
      externalId: subject.externalId,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      contactLabel: formatContactLabel(subject.contact),
      contactInitials: formatContactInitials(subject.contact),
      enrollment: subject.enrollments[0]
        ? {
            id: subject.enrollments[0].id,
            status: subject.enrollments[0].status,
            armId: subject.enrollments[0].arm.id,
            armName: subject.enrollments[0].arm.name,
            dagId: subject.enrollments[0].dagId,
            dagName: subject.enrollments[0].dag?.name ?? null,
          }
        : null,
    })),
  };
});

export type TSubjectRoster = Awaited<ReturnType<typeof getSubjectRoster>>;
export type TSubjectRosterItem = TSubjectRoster["subjects"][number];

export const getSubjectDetail = cache(async (environmentId: string, subjectId: string) => {
  const [{ study }, session] = await Promise.all([
    getClinicalStudyContext(environmentId),
    getServerSession(authOptions),
  ]);
  const actorId = session?.user?.id ?? null;

  // DAG access enforcement: build subject WHERE that respects DAG boundaries.
  const dagCount = await prisma.dataAccessGroup.count({ where: { studyId: study.id } });
  let subjectWhere: { id: string; studyId: string; enrollments?: object } = {
    id: subjectId,
    studyId: study.id,
  };
  let dagContext: DagContext = BYPASS_DAG_CONTEXT;

  if (dagCount > 0 && actorId) {
    const access = await getUserClinicalAccessForUser(actorId, environmentId, study.id);
    if (!access.isGlobalAdmin) {
      // Restricted user: subject must have a current enrollment in one of their DAGs
      subjectWhere = {
        ...subjectWhere,
        enrollments: { some: { dagId: { in: access.userDagIds } } },
      };
      dagContext = { userDagIds: access.userDagIds, bypass: false };
    }
  }

  const subjectDetailArgs = {
    where: subjectWhere,
    include: {
      contact: { select: selectContactIdentity },
      enrollments: {
        orderBy: { createdAt: "desc" as const },
        include: {
          arm: { select: { id: true, name: true } },
          events: {
            orderBy: { occurredAt: "desc" as const },
            select: {
              id: true,
              occurredAt: true,
              fromStatus: true,
              toStatus: true,
              byUserId: true,
              reason: true,
            },
          },
        },
      },
    },
  } satisfies Prisma.SubjectFindFirstArgs;
  type SubjectDetailPayload = Prisma.SubjectGetPayload<typeof subjectDetailArgs> | null;

  const loadSubject = async (): Promise<SubjectDetailPayload> =>
    prisma.subject.findFirst(subjectDetailArgs);

  const subject = await withDagContextAsync<SubjectDetailPayload>(dagContext, loadSubject);

  if (subject && shouldEmitReadEvent(AuditEvent.SUBJECT_VIEWED, actorId, study.projectId, "Subject")) {
    void logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.SUBJECT_VIEWED,
      actorId,
      projectId: study.projectId,
      resourceId: subject.id,
      resourceType: "Subject",
    });
  }

  return subject;
});

export type TSubjectDetail = Awaited<ReturnType<typeof getSubjectDetail>>;
