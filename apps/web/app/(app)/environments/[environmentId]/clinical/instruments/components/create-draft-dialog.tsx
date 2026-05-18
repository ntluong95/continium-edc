"use client";

import { useState, useTransition } from "react";
import { createDraftFromSurveyAction } from "@/modules/clinical/instruments/lib/instrument-actions";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/modules/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

interface SurveyOption {
  id: string;
  name: string;
  status: string;
}

interface CreateDraftDialogProps {
  environmentId: string;
  surveys: SurveyOption[];
}

export const CreateDraftDialog = ({ environmentId, surveys }: CreateDraftDialogProps) => {
  const { handleResult } = useActionToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [surveyId, setSurveyId] = useState(surveys[0]?.id ?? "");

  const handleCreate = () => {
    if (!surveyId) return;
    startTransition(async () => {
      const result = await createDraftFromSurveyAction({ environmentId, data: { surveyId } });
      if (handleResult(result, "Instrument draft created.")) {
        setOpen(false);
        setSurveyId(surveys[0]?.id ?? "");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" disabled={surveys.length === 0}>
          Create Draft
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Instrument Draft</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <p className="text-sm text-slate-600">
            A draft instrument is a versioned snapshot of a survey form. Select the survey you want to
            snapshot into a new instrument draft.
          </p>

          <div className="space-y-1">
            {surveys.length === 0 ? (
              <p className="text-sm text-slate-500">
                No survey-backed forms are available in this environment.
              </p>
            ) : (
              <Select value={surveyId} onValueChange={setSurveyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a survey" />
                </SelectTrigger>
                <SelectContent>
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={isPending} disabled={!surveyId || surveys.length === 0}>
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
