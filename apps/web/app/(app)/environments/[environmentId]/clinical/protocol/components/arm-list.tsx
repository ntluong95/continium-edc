"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import {
  createArmAction,
  deleteArmAction,
  reorderArmsAction,
  updateArmAction,
} from "@/modules/clinical/protocol/lib/arm-actions";
import type { TProtocolStudy } from "@/modules/clinical/protocol/lib/study-queries";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/ui/components/card";
import { Input } from "@/modules/ui/components/input";

type TArm = TProtocolStudy["arms"][number];

interface ArmListProps {
  environmentId: string;
  studyId: string;
  arms: TArm[];
  selectedArmId: string;
  onSelectArm: (armId: string) => void;
}

export const ArmList = ({
  environmentId,
  studyId,
  arms,
  selectedArmId,
  onSelectArm,
}: ArmListProps) => {
  const { handleResult } = useActionToast();
  const [newArmName, setNewArmName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateArm = () => {
    if (!newArmName.trim()) return;

    startTransition(async () => {
      const result = await createArmAction({
        environmentId,
        data: {
          studyId,
          name: newArmName.trim(),
        },
      });

      handleResult(result, "Arm added.");
      setNewArmName("");
    });
  };

  const handleMove = (armId: string, direction: "up" | "down") => {
    const index = arms.findIndex((arm) => arm.id === armId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= arms.length) return;

    const orderedIds = [...arms.map((arm) => arm.id)];
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];

    startTransition(async () => {
      const result = await reorderArmsAction({ environmentId, data: { studyId, orderedIds } });
      handleResult(result, "Arms reordered.");
    });
  };

  const handleDelete = (armId: string) => {
    startTransition(async () => {
      const result = await deleteArmAction({ environmentId, data: { id: armId } });
      handleResult(result, "Arm removed.");
    });
  };

  const handleRename = (armId: string, name: string) => {
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await updateArmAction({ environmentId, data: { id: armId, name: name.trim() } });
      handleResult(result, "Arm updated.");
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Study arms</CardTitle>
        <CardDescription>Select an arm to manage its visit schedule.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newArmName}
            onChange={(event) => setNewArmName(event.target.value)}
            placeholder="Add a new arm"
          />
          <Button type="button" onClick={handleCreateArm} loading={isPending}>
            <PlusIcon className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {arms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Add the first arm to start designing the visit schedule.
            </div>
          ) : null}

          {arms.map((arm, index) => {
            const isSelected = arm.id === selectedArmId;
            return (
              <div
                key={arm.id}
                className={cn(
                  "rounded-lg border",
                  isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200"
                )}>
                {/* Full-width clickable header to select the arm */}
                <button
                  type="button"
                  onClick={() => onSelectArm(arm.id)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm font-semibold text-slate-900",
                    "cursor-pointer rounded-t-lg hover:bg-slate-100",
                    isSelected && "rounded-b-none"
                  )}>
                  {arm.name}
                </button>

                {/* Edit controls — only shown when this arm is selected */}
                {isSelected && (
                  <form
                    className="space-y-3 border-t border-slate-200 p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      handleRename(arm.id, String(formData.get("name") ?? ""));
                    }}>
                    <Input name="name" defaultValue={arm.name} />

                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="secondary" size="sm" loading={isPending}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={index === 0 || isPending}
                        onClick={() => handleMove(arm.id, "up")}>
                        <ArrowUpIcon className="h-4 w-4" />
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={index === arms.length - 1 || isPending}
                        onClick={() => handleMove(arm.id, "down")}>
                        <ArrowDownIcon className="h-4 w-4" />
                        Down
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDelete(arm.id)}>
                        <Trash2Icon className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
