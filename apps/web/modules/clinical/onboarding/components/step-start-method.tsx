"use client";

import { FileBoxIcon, FileSpreadsheetIcon, SquareIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TClinicalProjectStartMethod } from "@/modules/clinical/onboarding/lib/template-types";
import type { WizardFormState } from "./onboarding-wizard";

interface StepStartMethodProps {
  form: WizardFormState;
  updateForm: (patch: Partial<WizardFormState>) => void;
}

interface MethodOption {
  value: TClinicalProjectStartMethod;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: MethodOption[] = [
  {
    value: "empty",
    label: "Create an empty clinical study",
    description:
      "Start with no arms, events, or instruments. Best when you already know exactly what you want to build.",
    icon: SquareIcon,
  },
  {
    value: "template",
    label: "Start from a template",
    description:
      "Pick from 15 Continium templates (translated from REDCap demos). Arms, events, and instruments are created automatically.",
    icon: FileSpreadsheetIcon,
  },
  {
    value: "import_later",
    label: "Import metadata later",
    description:
      "Skip setup for now. We&rsquo;ll create the study skeleton; you can import a REDCap or CDISC ODM file when import is ready.",
    icon: FileBoxIcon,
  },
];

export const StepStartMethod = ({ form, updateForm }: StepStartMethodProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">How do you want to start?</h2>
        <p className="text-sm text-slate-600">
          You can switch templates or migrate to a different layout from the protocol designer at any time.
        </p>
      </div>
      <div className="grid gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = form.startMethod === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateForm({
                  startMethod: option.value,
                  templateKey: option.value === "template" ? form.templateKey : null,
                })
              }
              className={cn(
                "flex items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-slate-900 bg-slate-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-400",
              )}
              aria-pressed={selected}>
              <Icon className="mt-1 h-5 w-5 shrink-0 text-slate-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                <p className="text-sm text-slate-600">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
