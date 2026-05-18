"use client";

import { Trash2Icon, UserPlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import {
  addDagMemberAction,
  removeDagMemberAction,
} from "@/modules/clinical/dag/lib/dag-member-actions";
import type { TDagDetail, TOrgMember } from "@/modules/clinical/dag/lib/dag-queries";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/ui/components/card";

type TMember = NonNullable<TDagDetail>["members"][number];

interface MemberManagerProps {
  environmentId: string;
  dagId: string;
  members: TMember[];
  availableMembers: TOrgMember[];
}

export const MemberManager = ({
  environmentId,
  dagId,
  members,
  availableMembers,
}: MemberManagerProps) => {
  const { handleResult } = useActionToast();
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const handleAdd = () => {
    if (!selectedUserId) return;
    startTransition(async () => {
      const result = await addDagMemberAction({
        environmentId,
        data: { dagId, userId: selectedUserId },
      });
      handleResult(result, "Member added.");
      setSelectedUserId("");
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await removeDagMemberAction({
        environmentId,
        data: { dagId, userId },
      });
      handleResult(result, "Member removed.");
    });
  };

  return (
    <div className="space-y-6">
      {/* Add member */}
      {availableMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <select
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Select a user…</option>
                {availableMembers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email} {user.name ? `(${user.email})` : ""}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={handleAdd}
                loading={isPending}
                disabled={!selectedUserId}>
                <UserPlusIcon className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Current members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">
              No members yet. Add users above to grant access to this DAG.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {member.user.name ?? member.user.email}
                    </p>
                    {member.user.name && (
                      <p className="text-xs text-slate-500">{member.user.email}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      Added {new Date(member.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(member.userId)}
                    disabled={isPending}>
                    <Trash2Icon className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
