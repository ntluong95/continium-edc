"use client";

import { TEnvironment } from "@continium/types/environment";
import { TOrganizationRole } from "@continium/types/memberships";
import { ProjectAndOrgSwitch } from "@/app/(app)/environments/[environmentId]/components/project-and-org-switch";
import { useEnvironment } from "@/app/(app)/environments/[environmentId]/context/environment-context";
import { getAccessFlags } from "@/lib/membership/utils";

interface TopControlBarProps {
  environments: TEnvironment[];
  currentOrganizationId: string;
  currentProjectId: string;
  isMultiOrgEnabled: boolean;
  organizationProjectsLimit: number;
  isContiniumCloud: boolean;
  isLicenseActive: boolean;
  isOwnerOrManager: boolean;
  isAccessControlAllowed: boolean;
  membershipRole?: TOrganizationRole;
}

export const TopControlBar = ({
  environments,
  currentOrganizationId,
  currentProjectId,
  isMultiOrgEnabled,
  organizationProjectsLimit,
  isContiniumCloud,
  isLicenseActive,
  isOwnerOrManager,
  isAccessControlAllowed,
  membershipRole,
}: TopControlBarProps) => {
  const { isMember, isBilling } = getAccessFlags(membershipRole);
  const isMembershipPending = membershipRole === undefined;
  const { environment } = useEnvironment();

  return (
    <div
      className="flex h-14 w-full items-center justify-between bg-slate-50 px-6"
      data-testid="fb__global-top-control-bar">
      <ProjectAndOrgSwitch
        currentEnvironmentId={environment.id}
        environments={environments}
        currentOrganizationId={currentOrganizationId}
        currentProjectId={currentProjectId}
        isMultiOrgEnabled={isMultiOrgEnabled}
        organizationProjectsLimit={organizationProjectsLimit}
        isContiniumCloud={isContiniumCloud}
        isLicenseActive={isLicenseActive}
        isOwnerOrManager={isOwnerOrManager}
        isMember={isMember}
        isBilling={isBilling}
        isMembershipPending={isMembershipPending}
        isAccessControlAllowed={isAccessControlAllowed}
      />
    </div>
  );
};
