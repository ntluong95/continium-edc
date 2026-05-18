import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { isClinicalOnboardingComplete } from "@/modules/clinical/onboarding/lib/onboarding-state";

interface ClinicalLayoutProps {
  params: Promise<{ environmentId: string }>;
  children: ReactNode;
}

/**
 * Clinical layout guard — runs once for all /clinical/** routes.
 * Calls notFound() if project.kind !== CLINICAL, rendering the 404 page.
 * If clinical onboarding has not been completed yet, redirects to the wizard.
 * The wizard route lives outside this layout (`/clinical-onboarding`) so there is no redirect loop.
 * Auth is already enforced by the outer environment layout.
 */
const ClinicalLayout = async ({ params, children }: ClinicalLayoutProps) => {
  const { environmentId } = await params;
  const project = await getProjectByEnvironmentId(environmentId);

  // assertClinicalProject calls notFound() if project is null or kind !== CLINICAL
  assertClinicalProject(project);

  const onboardingComplete = await isClinicalOnboardingComplete(project.id);
  if (!onboardingComplete) {
    redirect(`/environments/${environmentId}/clinical-onboarding`);
  }

  return <>{children}</>;
};

export default ClinicalLayout;
