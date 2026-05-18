"use client";

import { Shield, Users } from "lucide-react";
import { Button } from "@/modules/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/ui/components/table";
import type { TClinicalPermission } from "@/modules/clinical/access/lib/zod-schemas";

interface AccessListProps {
  environmentId: string;
  memberships: Array<{
    id: string;
    userId: string;
    userName: string | null;
    userEmail: string;
    roleName: string;
  }>;
  instruments: Array<{ id: string; name: string }>;
  events: Array<{ id: string; name: string }>;
  existingRules: Array<{
    userId: string;
    instrumentId: string | null;
    eventId: string | null;
    permission: TClinicalPermission;
  }>;
}

export function AccessList({
  environmentId,
  memberships,
  instruments,
  existingRules,
}: AccessListProps) {
  const getUserRules = (userId: string) =>
    existingRules.filter((r) => r.userId === userId);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild>
          <a href={`/environments/${environmentId}/clinical/access/rules`}>
            <Shield className="mr-2 h-4 w4" />
            Manage All Rules
          </a>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Instruments with Custom Rules</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.map((membership) => {
              const userRules = getUserRules(membership.userId);
              const hasRules = userRules.length > 0;

              return (
                <TableRow key={membership.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{membership.userName ?? "Unknown"}</span>
                      <span className="text-muted-foreground text-xs">
                        {membership.userEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {membership.roleName}
                    </span>
                  </TableCell>
                  <TableCell>
                    {hasRules ? (
                      <div className="flex flex-wrap gap-1">
                        {userRules
                          .filter((r) => r.instrumentId)
                          .slice(0, 3)
                          .map((r) => {
                            const instrument = instruments.find(
                              (i) => i.id === r.instrumentId
                            );
                            return (
                              <span
                                key={r.instrumentId}
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  r.permission === "NO_ACCESS"
                                    ? "bg-red-100 text-red-800"
                                    : r.permission === "READ"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {instrument?.name ?? "Unknown"}
                              </span>
                            );
                          })}
                        {userRules.filter((r) => r.instrumentId).length > 3 && (
                          <span className="text-muted-foreground text-xs">
                            +{userRules.filter((r) => r.instrumentId).length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Using role defaults
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`/environments/${environmentId}/clinical/access/${membership.id}`}
                      >
                        <Users className="mr-2 h-4 w4" />
                        Configure
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {memberships.length === 0 && (
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No team members</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add team members to the project to configure their access rules.
          </p>
        </div>
      )}
    </div>
  );
}