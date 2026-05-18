import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { getClinicalAccessRulesForMembership } from "@/modules/clinical/access/lib/rule-queries";
import { getMembershipsForStudy } from "@/modules/clinical/subjects/lib/membership-queries";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { RuleMatrixEditor } from "./components/rule-matrix-editor";

interface MembershipAccessPageProps {
  params: Promise<{ environmentId: string; membershipId: string }>;
}

const MembershipAccessPage = async ({ params }: MembershipAccessPageProps) => {
  const { environmentId, membershipId } = await params;

  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  const { study } = await import("@/modules/clinical/subjects/lib/subject-access").then(
    (m) => m.getClinicalStudyContext(environmentId)
  );

  const [membershipData, allMemberships] = await Promise.all([
    getClinicalAccessRulesForMembership(membershipId, study.id),
    getMembershipsForStudy(environmentId, study.id),
  ]);

  if (!membershipData) {
    return (
      <PageContentWrapper>
        <PageHeader pageTitle="Membership Not Found" />
        <p className="text-muted-foreground">
          The requested membership could not be found.
        </p>
      </PageContentWrapper>
    );
  }

  const roleName = String(membershipData.membership.role);

  return (
    <PageContentWrapper>
      <PageHeader
        pageTitle={`Access Rules: ${membershipData.membership.user.name ?? membershipData.membership.user.email}`}
      >
        <p className="text-sm text-muted-foreground">
          Configure per-instrument and per-event access for {roleName} role. Rules use additive narrowing — they can restrict but not expand beyond role permissions.
        </p>
      </PageHeader>
      <RuleMatrixEditor
        environmentId={environmentId}
        studyId={study.id}
        membershipId={membershipId}
        userId={membershipData.membership.user.id}
        userName={membershipData.membership.user.name ?? membershipData.membership.user.email}
        roleName={roleName}
        existingRules={membershipData.rules}
        allMemberships={allMemberships}
      />
    </PageContentWrapper>
  );
};

export default MembershipAccessPage;