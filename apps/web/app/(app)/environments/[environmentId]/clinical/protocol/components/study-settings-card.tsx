"use client";

import { Layers3Icon, Link2Icon, Rows3Icon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { upsertStudyAction } from "@/modules/clinical/protocol/lib/study-actions";
import type { TProtocolStudy } from "@/modules/clinical/protocol/lib/study-queries";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/ui/components/card";
import { Input } from "@/modules/ui/components/input";

interface StudySettingsCardProps {
  environmentId: string;
  projectName: string;
  study: TProtocolStudy;
  totalArms: number;
  totalEvents: number;
  totalBindings: number;
}

export const StudySettingsCard = ({
  environmentId,
  projectName,
  study,
  totalArms,
  totalEvents,
  totalBindings,
}: StudySettingsCardProps) => {
  const router = useRouter();
  const [name, setName] = useState(study.name);
  const [protocolId, setProtocolId] = useState(study.protocolId ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await upsertStudyAction({
        environmentId,
        data: {
          name: name.trim() || study.name,
          protocolId: protocolId.trim() || undefined,
        },
      });

      if (result?.serverError || result?.validationErrors) {
        toast.error(getFormattedErrorMessage(result));
        return;
      }

      toast.success("Protocol details saved.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl text-slate-900">{projectName} protocol designer</CardTitle>
          <CardDescription>
            Define study arms, visit windows, and which surveys are required at each event.
          </CardDescription>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Arms</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Layers3Icon className="h-4 w-4 text-slate-500" />
              {totalArms}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Events</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Rows3Icon className="h-4 w-4 text-slate-500" />
              {totalEvents}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bindings</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Link2Icon className="h-4 w-4 text-slate-500" />
              {totalBindings}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_auto]" onSubmit={handleSubmit}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Protocol name" />
          <Input
            value={protocolId}
            onChange={(event) => setProtocolId(event.target.value)}
            placeholder="Protocol ID (optional)"
          />
          <Button type="submit" loading={isPending} className="w-full lg:w-auto">
            <SaveIcon className="h-4 w-4" />
            Save study
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
