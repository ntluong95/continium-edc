import { InstrumentStatus } from "@prisma/client";

export const INSTRUMENT_STATUS_LABELS: Record<InstrumentStatus, string> = {
  [InstrumentStatus.DRAFT]: "Draft",
  [InstrumentStatus.PUBLISHED]: "Published",
  [InstrumentStatus.ARCHIVED]: "Archived",
};

export const INSTRUMENT_STATUS_BADGES: Record<
  InstrumentStatus,
  "warning" | "success" | "error" | "gray"
> = {
  [InstrumentStatus.DRAFT]: "warning",
  [InstrumentStatus.PUBLISHED]: "success",
  [InstrumentStatus.ARCHIVED]: "gray",
};
