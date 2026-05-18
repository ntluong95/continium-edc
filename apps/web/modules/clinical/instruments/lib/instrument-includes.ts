import "server-only";
import type { Prisma } from "@prisma/client";

/**
 * Canonical Prisma include for any Instrument read that feeds the data-entry
 * eligibility predicate. `getInstrumentDataEntryState` requires
 * `instrument.survey.status` to reach the correct decision, so this include is
 * the single source of truth for what an "eligibility-ready" Instrument shape
 * looks like.
 *
 * Use this in every query whose result is later passed to
 * `getInstrumentDataEntryState` / `assertInstrumentCanEnterData`. Combining
 * `satisfies Prisma.InstrumentInclude` with the derived `TInstrumentForEligibility`
 * type below makes "forgot to include survey" a compile-time error rather than
 * a runtime fallthrough.
 */
export const instrumentForEligibilityInclude = {
  survey: { select: { id: true, status: true } },
} satisfies Prisma.InstrumentInclude;

export type TInstrumentForEligibility = Prisma.InstrumentGetPayload<{
  include: typeof instrumentForEligibilityInclude;
}>;
