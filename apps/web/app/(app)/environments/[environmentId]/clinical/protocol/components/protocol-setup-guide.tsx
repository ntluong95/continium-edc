"use client";

import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const GUIDE_KEY = "clinical-protocol-guide-v1-hidden";

const STEPS = [
  {
    id: 1,
    label: "Overview",
    title: "Define arms & events",
    content: [
      "This application allows you to define 'events' for your project that allow for the utilization of data collection forms multiple times for any given project record (often used when collecting longitudinal data). An 'event' may be a temporal event in the course of your project, such as a participant visit or a task to be performed.",
      "After events have been defined, you will need to designate the data collection instruments that you wish to utilize for any or all events, thus allowing you to use a form for multiple events for the same project record.",
      "You may group your events into 'arms', in which you may have one or more arms/groups for your project. Each arm can have as many events as you wish. You may use the table below to create new events and/or arms, or modify existing ones. (One arm and one event will be initially defined as the default for all projects.)",
    ],
  },
  {
    id: 2,
    label: "Add events",
    title: "Add new events",
    content: [
      "To add new events below, provide an Event Name for that event, and then click the Add new event button.",
    ],
  },
  {
    id: 3,
    label: "Order events",
    title: "Reorder events",
    content: [
      "Once events have been added, you can easily change their order by dragging and dropping the event by hovering into event name and drag into desired position.",
    ],
  },
  {
    id: 4,
    label: "Assign instruments",
    title: "Designate instruments for events",
    content: [
      "Once you have defined your events on this page, you may navigate to the Designate Instruments for My Events page, where you may select which data collection instruments that you wish to utilize for each event you defined.",
      "Since you have defined multiple events on the Define My Events page, you may now select which data collection instruments that you wish to utilize for each event by using the table below. This allows you to enter data on any data collection form multiple times for any given project record. Any and all data collection instruments can thus be used for any event defined.",
    ],
  },
  {
    id: 5,
    label: "Save setup",
    title: "Finalize changes",
    content: [
      "Click the Begin Editing button to change the relationships below by designating which forms you wish to utilize for which events. When you are finished making changes, click the Save button to finalize your changes.",
    ],
  },
] as const;

type TStepId = (typeof STEPS)[number]["id"];

export const ProtocolSetupGuide = ({ projectName }: { projectName: string }) => {
  const [hidden, setHidden] = useState(false);
  const [activeStep, setActiveStep] = useState<TStepId>(1);

  useEffect(() => {
    setHidden(localStorage.getItem(GUIDE_KEY) === "1");
  }, []);

  const dismiss = () => { localStorage.setItem(GUIDE_KEY, "1"); setHidden(true); };
  const show    = () => { localStorage.removeItem(GUIDE_KEY); setHidden(false); };

  const active = STEPS.find((s) => s.id === activeStep)!;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Always-visible header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Build your visit schedule</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {projectName} · Define study arms and events, then assign instruments using the matrix below.
          </p>
        </div>
        <button
          type="button"
          onClick={hidden ? show : dismiss}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          {hidden ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronUpIcon className="h-3.5 w-3.5" />}
          {hidden ? "Show guide" : "Hide guide"}
        </button>
      </div>

      {/* Stepper + detail panel */}
      {!hidden && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {/* Step navigation */}
          <div className="flex items-start justify-center overflow-x-auto px-6 py-5">
            {STEPS.map((step, idx) => {
              const isActive = step.id === activeStep;
              return (
                <div key={step.id} className="flex items-start">
                  <button type="button" onClick={() => setActiveStep(step.id)} className="flex flex-col items-center gap-1.5">
                    <span className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-500 hover:border-slate-600 hover:text-slate-700"
                    )}>
                      {step.id}
                    </span>
                    <span className={cn(
                      "w-16 text-center text-[11px] font-medium leading-tight",
                      isActive ? "text-slate-900" : "text-slate-400"
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRightIcon className="mx-1 mt-2.5 h-4 w-4 shrink-0 text-slate-300" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="mx-6 mb-5 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Step {active.id} of {STEPS.length} — {active.label}
            </p>
            <p className="text-sm font-semibold text-slate-900">{active.title}</p>
            <div className="mt-2.5 space-y-2">
              {active.content.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-600">{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
