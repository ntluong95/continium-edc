import { redirect } from "next/navigation";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { ClinicalOnboardingWizard } from "@/modules/clinical/onboarding/components/onboarding-wizard";
import { isClinicalOnboardingComplete } from "@/modules/clinical/onboarding/lib/onboarding-state";
import { listClinicalTemplates } from "@/modules/clinical/onboarding/lib/templates";
import { summarizeTemplate } from "@/modules/clinical/onboarding/lib/template-types";

interface ClinicalOnboardingPageProps {
  params: Promise<{ environmentId: string }>;
}

const ClinicalOnboardingPage = async ({ params }: ClinicalOnboardingPageProps) => {
  const { environmentId } = await params;

  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  if (await isClinicalOnboardingComplete(project.id)) {
    redirect(`/environments/${environmentId}/clinical/protocol`);
  }

  const templates = listClinicalTemplates().map((template) => ({
    key: template.key,
    name: template.name,
    description: template.description,
    purpose: template.purpose,
    summary: summarizeTemplate(template),
    unsupportedFeatures: template.unsupportedFeatures ?? [],
    sourceFile: template.source.sourceFile,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <ClinicalOnboardingWizard
        environmentId={environmentId}
        defaultTitle={project.name}
        templates={templates}
      />
    </div>
  );
};

export default ClinicalOnboardingPage;
