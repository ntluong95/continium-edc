"use client";

import { FlaskConicalIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavigationLink } from "@/app/(app)/environments/[environmentId]/components/NavigationLink";

interface ClinicalNavSectionProps {
  environmentId: string;
  isCollapsed: boolean;
  isTextVisible: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

/**
 * Clinical sidebar nav entry — only rendered when project.kind === "CLINICAL".
 * NOTE: Currently integrated directly into the mainNavigation array in MainNavigation.tsx
 * rather than used as a standalone component (simpler pattern, avoids prop-drilling state).
 * Kept here as a standalone option for future use in more granular nav compositions.
 */
export const ClinicalNavSection = ({
  environmentId,
  isCollapsed,
  isTextVisible,
  disabled,
  disabledMessage,
}: ClinicalNavSectionProps) => {
  const pathname = usePathname();

  return (
    <NavigationLink
      href={`/environments/${environmentId}/clinical`}
      isActive={pathname?.includes("/clinical") ?? false}
      isCollapsed={isCollapsed}
      isTextVisible={isTextVisible}
      linkText="Clinical"
      disabled={disabled}
      disabledMessage={disabledMessage}>
      <FlaskConicalIcon strokeWidth={1.5} />
    </NavigationLink>
  );
};
