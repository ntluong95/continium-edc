"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeftIcon, ChevronRightIcon, FlaskConicalIcon } from "lucide-react";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { Button } from "@/modules/ui/components/button";
import { completeClinicalOnboardingAction } from "@/modules/clinical/onboarding/actions";
import {
  type TClinicalProjectPurpose,
  type TClinicalProjectStartMethod,
} from "@/modules/clinical/onboarding/lib/template-types";
import { OnboardingStepper, type StepDefinition } from "./onboarding-stepper";
import { StepBasics } from "./step-basics";
import { StepStartMethod } from "./step-start-method";
import { StepTemplate } from "./step-template";
import { StepReview } from "./step-review";
import type { TemplateSummaryView } from "./template-card";

interface OnboardingWizardProps {
  environmentId: string;
  defaultTitle: string;
  templates: TemplateSummaryView[];
}

export interface WizardFormState {
  title: string;
  protocolId: string;
  purpose: TClinicalProjectPurpose;
  notes: string;
  startMethod: TClinicalProjectStartMethod;
  templateKey: string | null;
}

const STEPS: StepDefinition[] = [
  { id: 1, label: "Study basics", description: "Title, purpose, and notes" },
  { id: 2, label: "Start method", description: "Empty, template, or import later" },
  { id: 3, label: "Choose template", description: "Pick a Continium template" },
  { id: 4, label: "Review & create", description: "Confirm and create the study" },
];

export const ClinicalOnboardingWizard = ({
  environmentId,
  defaultTitle,
  templates,
}: OnboardingWizardProps) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WizardFormState>({
    title: defaultTitle,
    protocolId: "",
    purpose: "research",
    notes: "",
    startMethod: "empty",
    templateKey: null,
  });

  const visibleSteps = useMemo(() => {
    if (form.startMethod === "template") return STEPS;
    return STEPS.filter((step) => step.id !== 3);
  }, [form.startMethod]);

  const updateForm = (patch: Partial<WizardFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const goToNextStep = () => {
    const nextId = visibleSteps.find((step) => step.id > activeStep)?.id;
    if (nextId !== undefined) setActiveStep(nextId);
  };

  const goToPreviousStep = () => {
    const reversed = [...visibleSteps].reverse();
    const prevId = reversed.find((step) => step.id < activeStep)?.id;
    if (prevId !== undefined) setActiveStep(prevId);
  };

  const isFirstVisibleStep = activeStep === visibleSteps[0]?.id;
  const isLastVisibleStep = activeStep === visibleSteps[visibleSteps.length - 1]?.id;

  const stepValid = (): boolean => {
    if (activeStep === 1) return form.title.trim().length > 0 && form.title.trim().length <= 120;
    if (activeStep === 2) return Boolean(form.startMethod);
    if (activeStep === 3) return Boolean(form.templateKey);
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await completeClinicalOnboardingAction({
      environmentId,
      title: form.title.trim(),
      protocolId: form.protocolId.trim().length > 0 ? form.protocolId.trim() : undefined,
      purpose: form.purpose,
      notes: form.notes.trim().length > 0 ? form.notes.trim() : undefined,
      startMethod: form.startMethod,
      templateKey: form.startMethod === "template" ? form.templateKey ?? undefined : undefined,
    });
    setSubmitting(false);

    if (result?.data?.ok) {
      toast.success("Clinical project created.");
      router.push(result.data.redirectTo);
      router.refresh();
      return;
    }
    toast.error(getFormattedErrorMessage(result));
  };

  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr]">
      <aside className="md:sticky md:top-10 md:self-start">
        <div className="mb-6 flex items-center gap-2 text-slate-900">
          <FlaskConicalIcon className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Set up your clinical project</h1>
        </div>
        <p className="mb-6 text-sm text-slate-600">
          We&rsquo;ll create your study, arms, events, and instruments for you. You can adjust everything
          afterwards in the protocol designer.
        </p>
        <OnboardingStepper steps={visibleSteps} activeStep={activeStep} />
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {activeStep === 1 ? <StepBasics form={form} updateForm={updateForm} /> : null}
        {activeStep === 2 ? <StepStartMethod form={form} updateForm={updateForm} /> : null}
        {activeStep === 3 ? (
          <StepTemplate form={form} updateForm={updateForm} templates={templates} />
        ) : null}
        {activeStep === 4 ? (
          <StepReview form={form} templates={templates} />
        ) : null}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
            disabled={isFirstVisibleStep || submitting}
            className="gap-2">
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </Button>
          {isLastVisibleStep ? (
            <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? "Creating..." : "Create clinical project"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={!stepValid() || submitting}
              className="gap-2">
              Continue
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};
