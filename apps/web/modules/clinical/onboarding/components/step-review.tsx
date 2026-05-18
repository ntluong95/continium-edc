"use client";

import type { TemplateSummaryView } from "./template-card";
import type { WizardFormState } from "./onboarding-wizard";

interface StepReviewProps {
  form: WizardFormState;
  templates: TemplateSummaryView[];
}

const formatPurpose = (value: string): string => {
  switch (value) {
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

const formatStartMethod = (value: string): string => {
  switch (value) {
    case "empty":
      return "Empty clinical study";
    case "template":
      return "Start from a template";
    case "import_later":
      return "Import metadata later";
    default:
      return value;
  }
};

export const StepReview = ({ form, templates }: StepReviewProps) => {
  const selectedTemplate =
    form.startMethod === "template" && form.templateKey
      ? templates.find((template) => template.key === form.templateKey) ?? null
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review and create</h2>
        <p className="text-sm text-slate-600">
          We&rsquo;ll create everything below in a single transaction. If anything fails, no changes are
          kept.
        </p>
      </div>

      <dl className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Title</dt>
          <dd className="text-slate-900">{form.title.trim()}</dd>
        </div>
        {form.protocolId.trim().length > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Protocol ID</dt>
            <dd className="text-slate-900">{form.protocolId.trim()}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Purpose</dt>
          <dd className="text-slate-900">{formatPurpose(form.purpose)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Start method</dt>
          <dd className="text-slate-900">{formatStartMethod(form.startMethod)}</dd>
        </div>
        {form.notes.trim().length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase text-slate-500">Notes</dt>
            <dd className="whitespace-pre-line text-slate-900">{form.notes.trim()}</dd>
          </div>
        ) : null}
      </dl>

      {selectedTemplate ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Selected template</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">{selectedTemplate.name}</h3>
          <p className="text-sm text-slate-600">{selectedTemplate.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 px-2 py-0.5">
              {selectedTemplate.summary.armCount} arm
              {selectedTemplate.summary.armCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-0.5">
              {selectedTemplate.summary.eventCount} event
              {selectedTemplate.summary.eventCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-0.5">
              {selectedTemplate.summary.instrumentCount} instrument
              {selectedTemplate.summary.instrumentCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-0.5">
              {selectedTemplate.summary.fieldCount} field
              {selectedTemplate.summary.fieldCount === 1 ? "" : "s"}
            </span>
          </div>
          {selectedTemplate.unsupportedFeatures.length > 0 ? (
            <p className="mt-3 text-xs text-amber-700">
              Some REDCap-specific behaviors won&rsquo;t be replicated:{" "}
              {selectedTemplate.unsupportedFeatures.join(", ")}.
            </p>
          ) : null}
        </div>
      ) : null}

      {form.startMethod === "import_later" ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          You&rsquo;ll land on the protocol designer with an empty study. When metadata import is
          available, you can drop in a REDCap or CDISC ODM file there.
        </div>
      ) : null}

      {form.startMethod === "empty" ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          A bare study will be created. You can then add arms, events, and instruments manually in the
          protocol designer.
        </div>
      ) : null}
    </div>
  );
};
