import { redirect } from "next/navigation";
import { TCloudBillingPlan } from "@continium/types/organizations";
import { IS_CONTINIUM_CLOUD } from "@/lib/constants";
import { getOrganizationBillingWithReadThroughSync } from "@/modules/ee/billing/lib/organization-billing";
import { getOrganizationAuth } from "@/modules/organization/lib/utils";
import { SelectPlanOnboarding } from "./components/select-plan-onboarding";

const PAID_PLANS = new Set<TCloudBillingPlan>(["pro", "scale", "custom"]);

interface PlanPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

const Page = async (props: PlanPageProps) => {
  const params = await props.params;

  if (!IS_CONTINIUM_CLOUD) {
    return redirect(`/organizations/${params.organizationId}/workspaces/new/mode`);
  }

  const { session } = await getOrganizationAuth(params.organizationId);

  if (!session?.user) {
    return redirect(`/auth/login`);
  }

  // Users with an existing paid/trial subscription should not be shown the trial page.
  // Redirect them directly to the next onboarding step.
  const billing = await getOrganizationBillingWithReadThroughSync(params.organizationId);
  const currentPlan = billing?.stripe?.plan;
  const hasExistingSubscription = currentPlan !== undefined && PAID_PLANS.has(currentPlan);

  if (hasExistingSubscription) {
    return redirect(`/organizations/${params.organizationId}/workspaces/new/mode`);
  }

  return <SelectPlanOnboarding organizationId={params.organizationId} />;
};

export default Page;
