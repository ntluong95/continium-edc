"use client";

import { useTranslation } from "react-i18next";

export type ResponseSourceFilterValue = "all" | "clinical" | "survey";

interface ResponseSourceFilterProps {
  value: ResponseSourceFilterValue;
  onChange: (value: ResponseSourceFilterValue) => void;
}

/**
 * Inline chip group for filtering the responses table by the analytics
 * source key written into `Response.meta.source`. "Clinical" matches
 * responses written by the clinical dual-write hook
 * (`CLINICAL_RESPONSE_SOURCE`), "Survey" matches everything else.
 *
 * The chip translates its selection into a `meta.source` predicate on
 * `TResponseFilterCriteria` (see `getSourceFilterCriteria` below). The
 * predicate is merged on top of the existing filter the user built in
 * the CustomFilter UI, so the two filter surfaces compose cleanly.
 */
export const ResponseSourceFilter = ({ value, onChange }: ResponseSourceFilterProps) => {
  const { t } = useTranslation();

  const options: { value: ResponseSourceFilterValue; label: string }[] = [
    { value: "all", label: t("environments.surveys.responses.source_all", { defaultValue: "All" }) },
    {
      value: "clinical",
      label: t("environments.surveys.responses.source_clinical", { defaultValue: "Clinical" }),
    },
    {
      value: "survey",
      label: t("environments.surveys.responses.source_survey", { defaultValue: "Survey" }),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t("environments.surveys.responses.source_filter", {
        defaultValue: "Filter by source",
      })}
      className="flex h-9 items-center rounded-md border bg-white p-1 text-sm">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1 transition-colors ${
              selected
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Returns a `TResponseFilterCriteria["meta"]` fragment that filters
 * `Response.meta.source`. Returns `null` when the user picks "all"
 * (no filtering needed).
 *
 * Kept here (alongside the chip) so the source-key constants stay
 * colocated with the UI that owns them.
 */
export const getSourceFilterCriteria = (
  value: ResponseSourceFilterValue
): { source: { op: "equals" | "notEquals"; value: string } } | null => {
  if (value === "all") return null;
  if (value === "clinical") {
    return { source: { op: "equals", value: "clinical_data_entry" } };
  }
  return { source: { op: "notEquals", value: "clinical_data_entry" } };
};
