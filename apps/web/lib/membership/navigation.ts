export const getBillingFallbackPath = (environmentId: string, isContiniumCloud: boolean): string => {
  const settingsPath = isContiniumCloud ? "billing" : "enterprise";
  return `/environments/${environmentId}/settings/${settingsPath}`;
};
