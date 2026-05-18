"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { TAuditLogPage, TAuditLogRow } from "@/modules/clinical/audit/lib/audit-queries";
import { Button } from "@/modules/ui/components/button";
import { AuditDetailDrawer } from "./audit-detail-drawer";

interface AuditTableProps {
  auditPage: TAuditLogPage;
  actors: { id: string; name: string; email: string }[];
}

export const AuditTable = ({ auditPage, actors }: AuditTableProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedRow, setSelectedRow] = useState<TAuditLogRow | null>(null);

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router]
  );

  const updatePage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }
      pushParams(params);
    },
    [pushParams, searchParams]
  );

  const getActorName = (actorId: string | null) => {
    if (!actorId) return "System";
    const actor = actors.find((a) => a.id === actorId);
    return actor ? `${actor.name} (${actor.email})` : actorId;
  };

  return (
    <div className="space-y-4">
      {auditPage.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 bg-white">
          No audit events found for the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
                <th className="px-4 py-3 whitespace-nowrap">Event</th>
                <th className="px-4 py-3 whitespace-nowrap">Actor</th>
                <th className="px-4 py-3 whitespace-nowrap">Resource</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditPage.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {row.occurredAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                    {row.event}
                  </td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={getActorName(row.actorId)}>
                    {getActorName(row.actorId)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {row.resourceType}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setSelectedRow(row)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {auditPage.pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {auditPage.page} of {auditPage.pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={auditPage.page <= 1}
              onClick={() => updatePage(auditPage.page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={auditPage.page >= auditPage.pageCount}
              onClick={() => updatePage(auditPage.page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <AuditDetailDrawer
        open={selectedRow !== null}
        onOpenChange={(open) => !open && setSelectedRow(null)}
        row={selectedRow}
        actorName={selectedRow ? getActorName(selectedRow.actorId) : undefined}
      />
    </div>
  );
};
