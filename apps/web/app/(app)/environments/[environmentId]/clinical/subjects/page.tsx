import Link from "next/link";
import type { EnrollmentStatus } from "@prisma/client";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { withReadEventScope } from "@/modules/clinical/audit/lib/dedupe-read-event";
import {
  getSubjectFormOptions,
  getSubjectRoster,
} from "@/modules/clinical/subjects/lib/subject-queries";
import { cn } from "@/lib/cn";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { AddSubjectDialog } from "./components/add-subject-dialog";
import { RecordStatusDashboard } from "./components/record-status-dashboard";
import { SharedStudyBar } from "./components/shared-study-bar";
import { SubjectRosterTable } from "./components/subject-roster-table";

const VALID_STATUSES: EnrollmentStatus[] = [
  "SCREENED", "ENROLLED", "ACTIVE", "COMPLETED", "SCREEN_FAIL", "WITHDRAWN", "LOST",
];

interface SubjectsPageProps {
  params: Promise<{ environmentId: string }>;
  searchParams: Promise<{
    view?: string;
    status?: string;
    armId?: string;
    dagId?: string;
    page?: string;
    search?: string;
  }>;
}

const SubjectsPage = async ({ params, searchParams }: SubjectsPageProps) => {
  const { environmentId } = await params;
  const { view, status, armId, dagId, page: pageStr, search } = await searchParams;

  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  const isDashboard = view === "dashboard";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const statusFilter =
    status && VALID_STATUSES.includes(status as EnrollmentStatus)
      ? (status as EnrollmentStatus)
      : undefined;

  const [roster, formOptions] = await withReadEventScope(() =>
    Promise.all([
      getSubjectRoster({ environmentId, status: statusFilter, armId, dagId, page, search }),
      getSubjectFormOptions(environmentId),
    ])
  );

  // Dashboard always needs a specific arm; Subjects tab allows empty = "All arms"
  const selectedArmId = isDashboard
    ? (armId ?? roster.arms[0]?.id ?? "")
    : (armId ?? "");
  const currentView = isDashboard ? "dashboard" : "subjects";

  return (
    <PageContentWrapper className="space-y-5 pb-16">
      {/* Page header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Subjects</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Manage clinical subject identifiers, arm assignment, DAG/site grouping, and enrollment lifecycle state.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <AddSubjectDialog
            environmentId={environmentId}
            arms={roster.arms}
            contacts={formOptions.contacts}
            dags={roster.dags}
            isGlobalAdmin={roster.isGlobalAdmin}
            userDagIds={roster.userDagIds}
          />
        </div>
      </div>

      {/* Tab navigation — above arm context */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <Link
          href={`?view=dashboard${selectedArmId ? `&armId=${selectedArmId}` : ""}`}
          className={cn(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            isDashboard
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}>
          Data Entry
        </Link>
        <Link
          href={`?view=subjects${selectedArmId ? `&armId=${selectedArmId}` : ""}${status ? `&status=${status}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
          className={cn(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            !isDashboard
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}>
          Dashboard
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-medium",
              !isDashboard ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            )}>
            {roster.statusCounts.total}
          </span>
        </Link>
      </div>

      {/* Shared study bar: arm switcher + per-arm KPI strip */}
      {roster.arms.length > 0 && (
        <SharedStudyBar
          environmentId={environmentId}
          arms={roster.arms}
          selectedArmId={selectedArmId}
          currentView={currentView}
          currentStatus={statusFilter}
          currentSearch={search}
        />
      )}

      {/* Tab content */}
      {isDashboard ? (
        <RecordStatusDashboard
          environmentId={environmentId}
          selectedArmId={selectedArmId}
        />
      ) : (
        <SubjectRosterTable
          environmentId={environmentId}
          subjects={roster.subjects}
          arms={roster.arms}
          dags={roster.dags}
          isGlobalAdmin={roster.isGlobalAdmin}
          userDagIds={roster.userDagIds}
          totalCount={roster.totalCount}
          page={roster.page}
          pageCount={roster.pageCount}
          currentStatus={statusFilter}
          currentArmId={armId}
          currentDagId={dagId}
          currentSearch={search}
        />
      )}
    </PageContentWrapper>
  );
};

export default SubjectsPage;
