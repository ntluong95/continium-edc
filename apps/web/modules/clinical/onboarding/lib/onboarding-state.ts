import "server-only";
import { prisma } from "@continium/database";

export type ClinicalOnboardingState = {
  id: string;
  projectId: string;
  purpose: string | null;
  startMethod: string | null;
  templateKey: string | null;
  notes: string | null;
  completedAt: Date | null;
};

export const getClinicalOnboardingByProjectId = async (
  projectId: string,
): Promise<ClinicalOnboardingState | null> => {
  const onboarding = await prisma.clinicalProjectOnboarding.findUnique({
    where: { projectId },
    select: {
      id: true,
      projectId: true,
      purpose: true,
      startMethod: true,
      templateKey: true,
      notes: true,
      completedAt: true,
    },
  });
  if (!onboarding) return null;
  return {
    ...onboarding,
    purpose: onboarding.purpose ?? null,
    startMethod: onboarding.startMethod ?? null,
  };
};

export const isClinicalOnboardingComplete = async (projectId: string): Promise<boolean> => {
  const row = await prisma.clinicalProjectOnboarding.findUnique({
    where: { projectId },
    select: { completedAt: true },
  });
  return Boolean(row?.completedAt);
};
