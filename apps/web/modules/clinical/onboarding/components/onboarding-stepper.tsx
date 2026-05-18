"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepDefinition {
  id: number;
  label: string;
  description?: string;
}

interface OnboardingStepperProps {
  steps: StepDefinition[];
  activeStep: number;
}

export const OnboardingStepper = ({ steps, activeStep }: OnboardingStepperProps) => {
  return (
    <ol className="flex flex-col gap-3" aria-label="Clinical onboarding steps">
      {steps.map((step) => {
        const status: "completed" | "active" | "upcoming" =
          activeStep > step.id ? "completed" : activeStep === step.id ? "active" : "upcoming";
        return (
          <li
            key={step.id}
            className={cn(
              "flex gap-3 rounded-lg border p-3 transition-colors",
              status === "active" && "border-slate-900 bg-slate-50",
              status === "completed" && "border-slate-200 bg-white",
              status === "upcoming" && "border-dashed border-slate-200 bg-white",
            )}
            aria-current={status === "active" ? "step" : undefined}>
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                status === "completed" && "bg-emerald-600 text-white",
                status === "active" && "bg-slate-900 text-white",
                status === "upcoming" && "bg-slate-100 text-slate-500",
              )}>
              {status === "completed" ? <CheckIcon className="h-4 w-4" /> : step.id}
            </div>
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  status === "upcoming" ? "text-slate-500" : "text-slate-900",
                )}>
                {step.label}
              </p>
              {step.description ? (
                <p className="text-xs text-slate-500">{step.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
