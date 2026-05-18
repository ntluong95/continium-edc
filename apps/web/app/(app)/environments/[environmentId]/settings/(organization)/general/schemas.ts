import { z } from "zod";
import { ZId } from "@continium/types/common";
import { ZOrganizationUpdateInput } from "@continium/types/organizations";

export const ZOrganizationAISettingsInput = ZOrganizationUpdateInput.pick({
  isAISmartToolsEnabled: true,
  isAIDataAnalysisEnabled: true,
});

export const ZUpdateOrganizationAISettingsAction = z.object({
  organizationId: ZId,
  data: ZOrganizationAISettingsInput,
});
