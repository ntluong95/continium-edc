"use client";

import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@/modules/ui/components/radio-group";
import type { TClinicalProjectPurpose } from "@/modules/clinical/onboarding/lib/template-types";
import type { WizardFormState } from "./onboarding-wizard";

interface StepBasicsProps {
  form: WizardFormState;
  updateForm: (patch: Partial<WizardFormState>) => void;
}

const PURPOSE_OPTIONS: { value: TClinicalProjectPurpose; label: string; helper: string }[] = [
  { value: "research", label: "Research", helper: "Hypothesis-driven studies, registries, trials" },
  { value: "quality_improvement", label: "Quality improvement", helper: "Process change measurement" },
  {
    value: "operational_support",
    label: "Operational support",
    helper: "Tracking, intake, programmatic workflows",
  },
  { value: "practice", label: "Practice / Training", helper: "Sandbox, evaluation, training accounts" },
  { value: "other", label: "Other", helper: "Anything else" },
];

export const StepBasics = ({ form, updateForm }: StepBasicsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Tell us about your study</h2>
        <p className="text-sm text-slate-600">
          Title, an optional protocol ID, and what this project is for. You can edit anything later.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-title">
          Project / study title <span className="text-red-600">*</span>
        </Label>
        <Input
          id="onboarding-title"
          value={form.title}
          onChange={(event) => updateForm({ title: event.target.value })}
          maxLength={120}
          required
        />
        <p className="text-xs text-slate-500">Shown across the clinical workspace.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-protocol-id">Protocol ID (optional)</Label>
        <Input
          id="onboarding-protocol-id"
          value={form.protocolId}
          onChange={(event) => updateForm({ protocolId: event.target.value })}
          maxLength={100}
          placeholder="e.g. SPONSOR-2026-001"
        />
      </div>

      <div className="space-y-2">
        <Label>
          Purpose of this project <span className="text-red-600">*</span>
        </Label>
        <RadioGroup
          value={form.purpose}
          onValueChange={(value) => updateForm({ purpose: value as TClinicalProjectPurpose })}
          className="grid gap-3 sm:grid-cols-2">
          {PURPOSE_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`purpose-${option.value}`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-slate-400">
              <RadioGroupItem id={`purpose-${option.value}`} value={option.value} className="mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-900">{option.label}</p>
                <p className="text-xs text-slate-500">{option.helper}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-notes">Project notes (optional)</Label>
        <textarea
          id="onboarding-notes"
          value={form.notes}
          onChange={(event) => updateForm({ notes: event.target.value })}
          maxLength={2000}
          rows={3}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="What is the study scope? Any context other team members should see on the My Projects page."
        />
      </div>
    </div>
  );
};
