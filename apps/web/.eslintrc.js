module.exports = {
  extends: ["@continium/eslint-config/legacy-next.js"],
  ignorePatterns: ["**/package.json", "**/tsconfig.json"],
  overrides: [
    {
      // Continium-owned territory: no imports from Formbricks Enterprise modules.
      // The single allow-listed crossing is apps/web/modules/billing/lib/cloud-license-source.ts
      // (intentionally outside this glob — see its header).
      //
      // See plans/260517-1605-continium-licensing-refactor/plan.md acceptance #2.
      files: [
        "modules/clinical/**/*.{ts,tsx}",
        "modules/entitlements/**/*.{ts,tsx}",
        "modules/continium/**/*.{ts,tsx}",
        "app/(app)/environments/\\[environmentId\\]/clinical/**/*.{ts,tsx}",
        "app/(app)/environments/\\[environmentId\\]/clinical-onboarding/**/*.{ts,tsx}",
        "app/api/v1/management/clinical/**/*.{ts,tsx}",
        "modules/projects/settings/lib/convert-to-clinical-action.ts",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@/modules/ee/*", "@/modules/ee"],
                message:
                  "Continium-owned modules MUST NOT import from @/modules/ee/. See plans/260517-1605-continium-licensing-refactor/plan.md.",
              },
            ],
          },
        ],
      },
    },
  ],
};
