import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { getInstrumentPermissionsForStudy } from "@/modules/clinical/access/lib/rule-queries";
import { getMembershipsForStudy } from "@/modules/clinical/subjects/lib/membership-queries";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { AccessList } from "./components/access-list";

interface AccessPageProps {
  params: Promise<{ environmentId: string }>;
}

const AccessPage = async ({ params }: AccessPageProps) => {
  const { environmentId } = await params;

  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  const { study } = await import("@/modules/clinical/subjects/lib/subject-access").then(
    (m) => m.getClinicalStudyContext(environmentId)
  );

  const [permissionsData, memberships] = await Promise.all([
    getInstrumentPermissionsForStudy(study.id),
    getMembershipsForStudy(environmentId, study.id),
  ]);

  return (
    <PageContentWrapper>
      <PageHeader pageTitle="Clinical Access Control">
        <p className="text-sm text-muted-foreground">
          Configure per-instrument and per-event access rules for study members. Rules can restrict access but not grant beyond role permissions.
        </p>
      </PageHeader>
      <AccessList
        environmentId={environmentId}
        memberships={memberships}
        instruments={permissionsData.instruments}
        events={permissionsData.events}
        existingRules={permissionsData.rules}
      />
    </PageContentWrapper>
  );
};

export default AccessPage;