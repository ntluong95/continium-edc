import Link from "next/link";
import { notFound } from "next/navigation";
import type { EnrollmentStatus } from "@prisma/client";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { withReadEventScope } from "@/modules/clinical/audit/lib/dedupe-read-event";
import { ENROLLMENT_STATUS_LABELS } from "@/modules/clinical/subjects/lib/enrollment-state-machine";
import { formatContactLabel, getSubjectDetail } from "@/modules/clinical/subjects/lib/subject-queries";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/ui/components/card";
import { GoBackButton } from "@/modules/ui/components/go-back-button";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { EnrollmentStatusBanner } from "../components/enrollment-status-banner";
import { TransitionActionButtons } from "../components/transition-action-buttons";

interface SubjectDetailPageProps {
  params: Promise<{ environmentId: string; subjectId: string }>;
}

interface SubjectDetailEnrollmentEvent {
  id: string;
  occurredAt: Date;
  fromStatus: EnrollmentStatus | null;
  toStatus: EnrollmentStatus;
  byUserId: string | null;
  reason: string | null;
}

interface SubjectDetailEnrollment {
  id: string;
  status: EnrollmentStatus;
  createdAt: Date;
  enrolledAt: Date | null;
  arm: { name: string };
  events: SubjectDetailEnrollmentEvent[];
}

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

const SubjectDetailPage = async ({ params }: SubjectDetailPageProps) => {
  const { environmentId, subjectId } = await params;

  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  const subject = await withReadEventScope(() => getSubjectDetail(environmentId, subjectId));
  if (!subject) notFound();

  const enrollments = subject.enrollments as SubjectDetailEnrollment[];
  const latestEnrollment = enrollments[0] ?? null;
  const contactLabel = formatContactLabel(subject.contact);

  return (
    <PageContentWrapper className="pb-24">
      <GoBackButton url={`/environments/${environmentId}/clinical/subjects`} />
      <PageHeader
        pageTitle={subject.externalId}
        cta={
          <Button asChild>
            <Link href={`/environments/${environmentId}/clinical/subjects/${subject.id}/data`}>
              Data entry
            </Link>
          </Button>
        }>
        <div className="space-y-3 pt-2">
          {latestEnrollment ? (
            <EnrollmentStatusBanner
              status={latestEnrollment.status}
              armName={latestEnrollment.arm.name}
              enrolledAt={latestEnrollment.enrolledAt}
            />
          ) : (
            <p className="text-sm text-slate-500">No enrollment recorded for this subject yet.</p>
          )}
          <p className="text-sm text-slate-500">Created {formatDateTime(subject.createdAt)}</p>
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Subject summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Linked contact</p>
              <p className="mt-1 text-sm text-slate-900">{contactLabel ?? "No contact linked"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current arm</p>
              <p className="mt-1 text-sm text-slate-900">{latestEnrollment?.arm.name ?? "None"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current status</p>
              <p className="mt-1 text-sm text-slate-900">
                {latestEnrollment ? ENROLLMENT_STATUS_LABELS[latestEnrollment.status] : "Not enrolled"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Enrollment records</p>
              <p className="mt-1 text-sm text-slate-900">{enrollments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Status transitions</CardTitle>
          </CardHeader>
          <CardContent>
            {latestEnrollment ? (
              <TransitionActionButtons
                environmentId={environmentId}
                enrollmentId={latestEnrollment.id}
                currentStatus={latestEnrollment.status}
              />
            ) : (
              <p className="text-sm text-slate-500">
                A transition becomes available once the subject has an enrollment record.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Enrollment history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollments.length === 0 ? (
            <p className="text-sm text-slate-500">No enrollments recorded.</p>
          ) : (
            enrollments.map((enrollment, index) => (
              <div key={enrollment.id} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Arm: {enrollment.arm.name}</span>
                    {index === 0 ? (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-500">
                    Created {formatDateTime(enrollment.createdAt)}
                  </span>
                </div>

                {enrollment.events.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">No lifecycle events recorded.</p>
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {enrollment.events.map((event) => (
                      <li key={event.id} className="flex gap-3 px-4 py-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm text-slate-800">
                            {event.fromStatus ? (
                              <>
                                <span className="font-medium">
                                  {ENROLLMENT_STATUS_LABELS[event.fromStatus]}
                                </span>{" "}
                                to{" "}
                              </>
                            ) : (
                              "Initialized at "
                            )}
                            <span className="font-medium">{ENROLLMENT_STATUS_LABELS[event.toStatus]}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(event.occurredAt)} by {event.byUserId ?? "System"}
                          </p>
                          {event.reason ? <p className="text-xs text-slate-600">{event.reason}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageContentWrapper>
  );
};

export default SubjectDetailPage;
