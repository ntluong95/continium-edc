"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/modules/ui/components/input";
import { TemplateCard, type TemplateSummaryView } from "./template-card";
import type { WizardFormState } from "./onboarding-wizard";

interface StepTemplateProps {
  form: WizardFormState;
  updateForm: (patch: Partial<WizardFormState>) => void;
  templates: TemplateSummaryView[];
}

export const StepTemplate = ({ form, updateForm, templates }: StepTemplateProps) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return templates;
    return templates.filter((template) =>
      [template.name, template.description, template.purpose].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [query, templates]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Choose a template</h2>
        <p className="text-sm text-slate-600">
          Each template translates a REDCap demo project into Continium arms, events, instruments, and
          fields. You can rename, reorder, or remove anything later.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
        <Input
          aria-label="Search templates"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates by name or description..."
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((template) => (
          <TemplateCard
            key={template.key}
            template={template}
            selected={form.templateKey === template.key}
            onSelect={() => updateForm({ templateKey: template.key })}
          />
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-full rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No templates match &ldquo;{query}&rdquo;. Try a different search term.
          </p>
        ) : null}
      </div>
    </div>
  );
};
