"use client";

import { AlertTriangleIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TemplateSummaryView {
  key: string;
  name: string;
  description: string;
  purpose: string;
  summary: { armCount: number; eventCount: number; instrumentCount: number; fieldCount: number };
  unsupportedFeatures: string[];
  sourceFile: string;
}

interface TemplateCardProps {
  template: TemplateSummaryView;
  selected: boolean;
  onSelect: () => void;
}

const formatPurpose = (purpose: string): string => {
  switch (purpose) {
    case "research":
      return "Research";
    case "operational_support":
      return "Operational support";
    case "practice":
      return "Practice / Training";
    case "quality_improvement":
      return "Quality improvement";
    default:
      return "Other";
  }
};

export const TemplateCard = ({ template, selected, onSelect }: TemplateCardProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        selected
          ? "border-slate-900 bg-slate-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-400",
      )}
      aria-pressed={selected}>
      <div className="flex w-full items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {formatPurpose(template.purpose)}
        </span>
      </div>
      <p className="text-sm text-slate-600">{template.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-slate-200 px-2 py-0.5">
          {template.summary.armCount} arm{template.summary.armCount === 1 ? "" : "s"}
        </span>
        <span className="rounded-full border border-slate-200 px-2 py-0.5">
          {template.summary.eventCount} event{template.summary.eventCount === 1 ? "" : "s"}
        </span>
        <span className="rounded-full border border-slate-200 px-2 py-0.5">
          {template.summary.instrumentCount} instrument
          {template.summary.instrumentCount === 1 ? "" : "s"}
        </span>
        <span className="rounded-full border border-slate-200 px-2 py-0.5">
          {template.summary.fieldCount} field{template.summary.fieldCount === 1 ? "" : "s"}
        </span>
      </div>
      {template.unsupportedFeatures.length > 0 ? (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p className="font-medium">Some REDCap-specific features are not yet supported:</p>
            <ul className="ml-3 list-disc">
              {template.unsupportedFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </button>
  );
};
