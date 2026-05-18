import { z } from "zod";
import {
  ALL_CONTINIUM_FEATURES,
  COMPLIANCE_LOCKED_FEATURES,
  type ContiniumFeature,
} from "./features";
import { ALL_CONTINIUM_PLANS, type ContiniumEdition } from "./plans";
import { ContiniumLicensingEnvError } from "./errors";

const MAX_DISABLED_FEATURES_INPUT_LENGTH = 1024;
const SAFE_DISABLED_FEATURES_PATTERN = /^[a-zA-Z0-9_,]*$/;

const ZContiniumEdition = z.enum(ALL_CONTINIUM_PLANS as readonly [ContiniumEdition, ...ContiniumEdition[]]);

const ZContiniumFeature = z.enum(
  ALL_CONTINIUM_FEATURES as readonly [ContiniumFeature, ...ContiniumFeature[]],
);

export type ContiniumLicensingEnvInput = {
  CONTINIUM_EDITION?: string;
  CONTINIUM_DISABLED_FEATURES?: string;
};

export type ContiniumLicensingEnv = {
  edition: ContiniumEdition;
  disabledFeatures: ContiniumFeature[];
};

const parseEdition = (raw: string | undefined): ContiniumEdition => {
  if (raw === undefined || raw.trim() === "") return "selfHosted";
  const result = ZContiniumEdition.safeParse(raw.trim());
  if (!result.success) {
    throw new ContiniumLicensingEnvError(
      `Invalid CONTINIUM_EDITION: "${raw}". Allowed values: ${ALL_CONTINIUM_PLANS.join(", ")}.`,
    );
  }
  return result.data;
};

const parseDisabledFeatures = (raw: string | undefined): ContiniumFeature[] => {
  if (raw === undefined || raw.trim() === "") return [];

  if (raw.length > MAX_DISABLED_FEATURES_INPUT_LENGTH) {
    throw new ContiniumLicensingEnvError(
      `CONTINIUM_DISABLED_FEATURES is too long (${raw.length} > ${MAX_DISABLED_FEATURES_INPUT_LENGTH}).`,
    );
  }
  if (!SAFE_DISABLED_FEATURES_PATTERN.test(raw)) {
    throw new ContiniumLicensingEnvError(
      "CONTINIUM_DISABLED_FEATURES contains disallowed characters. Only [a-zA-Z0-9_,] are permitted.",
    );
  }

  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  for (const entry of entries) {
    const parsed = ZContiniumFeature.safeParse(entry);
    if (!parsed.success) {
      throw new ContiniumLicensingEnvError(
        `Unknown Continium feature key in CONTINIUM_DISABLED_FEATURES: "${entry}". ` +
          `Known features: ${ALL_CONTINIUM_FEATURES.join(", ")}.`,
      );
    }
    if (COMPLIANCE_LOCKED_FEATURES.has(parsed.data)) {
      throw new ContiniumLicensingEnvError(
        `Continium feature "${entry}" is compliance-locked and cannot be disabled via ` +
          "CONTINIUM_DISABLED_FEATURES (21 CFR Part 11 / clinical-mode integrity).",
      );
    }
  }

  return entries as ContiniumFeature[];
};

/**
 * Parses Continium licensing env vars.
 *
 * Pure function — takes the env source as an argument so tests can pass
 * a plain object instead of mutating `process.env`.
 *
 * Fail-closed semantics:
 * - Unknown edition → throws
 * - Unknown feature key → throws
 * - Compliance-locked feature in disable list → throws
 * - Oversized or unsafe-character input → throws
 */
export const readContiniumLicensingEnv = (
  env: Partial<ContiniumLicensingEnvInput> & Record<string, string | undefined> = process.env,
): ContiniumLicensingEnv => ({
  edition: parseEdition(env.CONTINIUM_EDITION),
  disabledFeatures: parseDisabledFeatures(env.CONTINIUM_DISABLED_FEATURES),
});
