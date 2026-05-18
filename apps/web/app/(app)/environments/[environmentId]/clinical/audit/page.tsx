import { withReadEventScope } from "@/modules/clinical/audit/lib/dedupe-read-event";
import { auditFilterQuerySchema } from "@/modules/clinical/audit/lib/audit-filter-schema";
import { getAuditActors, getAuditLogPage } from "@/modules/clinical/audit/lib/audit-queries";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { AuditFilters } from "./components/audit-filters";
import { AuditTable } from "./components/audit-table";
import { ExportCsvButton } from "./components/export-csv-button";

interface AuditPageProps {
  params: Promise<{ environmentId: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    event?: string;
    actorId?: string;
    resourceType?: string;
    search?: string;
    page?: string;
  }>;
}

const AuditPage = async ({ params, searchParams }: AuditPageProps) => {
  const { environmentId } = await params;
  const parsed = auditFilterQuerySchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};
  const actorFilters = { ...filters, actorId: undefined, page: undefined };

  const [auditPage, actors] = await withReadEventScope(() =>
    Promise.all([
      getAuditLogPage(environmentId, filters),
      getAuditActors(environmentId, actorFilters),
    ])
  );

  return (
    <PageContentWrapper className="space-y-6">
      <PageHeader
        pageTitle="Audit Trail"
        cta={<ExportCsvButton environmentId={environmentId} filters={filters} />}>
        <p className="text-sm text-slate-500">
          View immutable audit logs for all clinical operations, access events, and systemic changes.
        </p>
      </PageHeader>

      <AuditFilters actors={actors} currentFilters={filters} total={auditPage.total} />
      <AuditTable auditPage={auditPage} actors={actors} />
    </PageContentWrapper>
  );
};

export default AuditPage;
