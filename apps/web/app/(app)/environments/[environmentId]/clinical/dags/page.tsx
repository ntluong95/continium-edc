import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { getDagsForStudy } from "@/modules/clinical/dag/lib/dag-queries";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { DagList } from "./components/dag-list";

interface DagsPageProps {
  params: Promise<{ environmentId: string }>;
}

const DagsPage = async ({ params }: DagsPageProps) => {
  const { environmentId } = await params;

  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  const dags = await getDagsForStudy(environmentId);

  return (
    <PageContentWrapper>
      <PageHeader pageTitle="Data Access Groups">
        <p className="text-sm text-muted-foreground">
          Control site-level data visibility. Users assigned to a DAG see only subjects enrolled in that DAG.
        </p>
      </PageHeader>
      <DagList environmentId={environmentId} dags={dags} />
    </PageContentWrapper>
  );
};

export default DagsPage;
