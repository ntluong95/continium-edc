import { notFound } from "next/navigation";
import { getDagDetail, getOrgMembersForEnvironment } from "@/modules/clinical/dag/lib/dag-queries";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { MemberManager } from "./components/member-manager";

interface DagDetailPageProps {
  params: Promise<{ environmentId: string; dagId: string }>;
}

const DagDetailPage = async ({ params }: DagDetailPageProps) => {
  const { environmentId, dagId } = await params;

  const [dag, orgMembers] = await Promise.all([
    getDagDetail(environmentId, dagId),
    getOrgMembersForEnvironment(environmentId),
  ]);

  if (!dag) notFound();

  const existingMemberIds = new Set(dag.members.map((m) => m.userId));
  const availableMembers = orgMembers.filter((m) => !existingMemberIds.has(m.id));

  return (
    <PageContentWrapper>
      <PageHeader pageTitle={dag.name}>
        <p className="text-sm text-muted-foreground">
          Code: {dag.code} · {dag._count.members} member{dag._count.members !== 1 ? "s" : ""} · {dag._count.enrollments} enrollment{dag._count.enrollments !== 1 ? "s" : ""}
        </p>
      </PageHeader>
      <MemberManager
        environmentId={environmentId}
        dagId={dagId}
        members={dag.members}
        availableMembers={availableMembers}
      />
    </PageContentWrapper>
  );
};

export default DagDetailPage;
