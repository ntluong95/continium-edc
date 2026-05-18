import { getProjectByEnvironmentId } from "@/lib/project/service";
import { getSurveyOptions } from "@/modules/clinical/instruments/lib/instrument-queries";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { ensureStudyForProject, getStudyTree } from "@/modules/clinical/protocol/lib/study-queries";
import { ProtocolDesigner } from "./components/protocol-designer";

interface ProtocolPageProps {
  params: Promise<{ environmentId: string }>;
  searchParams?: Promise<{ setup?: string | string[] }>;
}

const ProtocolPage = async ({ params, searchParams }: ProtocolPageProps) => {
  const { environmentId } = await params;
  const setup = (await searchParams)?.setup;
  const project = await getProjectByEnvironmentId(environmentId);

  assertClinicalProject(project);
  await ensureStudyForProject(project.id, project.name);

  const [study, surveys] = await Promise.all([getStudyTree(project.id), getSurveyOptions(environmentId)]);

  if (!study) {
    throw new Error("Failed to initialize the clinical protocol.");
  }

  return (
    <ProtocolDesigner
      environmentId={environmentId}
      projectName={project.name}
      study={study}
      surveys={surveys}
      setupState={setup === "template" ? "template" : null}
    />
  );
};

export default ProtocolPage;
