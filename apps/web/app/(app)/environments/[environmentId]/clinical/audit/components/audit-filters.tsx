"use client";

import { AuditEvent } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AuditFilters as AuditFilterValues } from "@/modules/clinical/audit/lib/audit-queries";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

const RESOURCE_TYPES = [
  "AuditLog",
  "DagMember",
  "DataAccessGroup",
  "Enrollment",
  "Instrument",
  "Record",
  "RecordValue",
  "Subject",
  "User",
] as const;

interface AuditFiltersProps {
  actors: { id: string; name: string; email: string }[];
  currentFilters: AuditFilterValues;
  total: number;
}

export const AuditFilters = ({ actors, currentFilters, total }: AuditFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.search ?? "");

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router]
  );

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      pushParams(params);
    },
    [pushParams, searchParams]
  );

  useEffect(() => {
    setSearchValue(currentFilters.search ?? "");
  }, [currentFilters.search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextValue = searchValue.trim();
      const currentValue = currentFilters.search ?? "";
      if (nextValue === currentValue) {
        return;
      }

      updateFilter("search", nextValue || undefined);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [currentFilters.search, searchValue, updateFilter]);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search actor or target ID..."
          className="w-full max-w-xs bg-white"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />

        <Select
          value={currentFilters.event ?? "all"}
          onValueChange={(value) => updateFilter("event", value === "all" ? undefined : value)}>
          <SelectTrigger className="w-56 bg-white">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.values(AuditEvent).map((eventName) => (
              <SelectItem key={eventName} value={eventName}>
                {eventName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.actorId ?? "all"}
          onValueChange={(value) => updateFilter("actorId", value === "all" ? undefined : value)}>
          <SelectTrigger className="w-56 bg-white">
            <SelectValue placeholder="All actors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            {actors.map((actor) => (
              <SelectItem key={actor.id} value={actor.id}>
                {actor.name} ({actor.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.resourceType ?? "all"}
          onValueChange={(value) => updateFilter("resourceType", value === "all" ? undefined : value)}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="All target types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All target types</SelectItem>
            {RESOURCE_TYPES.map((resourceType) => (
              <SelectItem key={resourceType} value={resourceType}>
                {resourceType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          className="w-44 bg-white"
          value={currentFilters.from ?? ""}
          onChange={(event) => updateFilter("from", event.target.value || undefined)}
        />
        <Input
          type="date"
          className="w-44 bg-white"
          value={currentFilters.to ?? ""}
          onChange={(event) => updateFilter("to", event.target.value || undefined)}
        />
        <Input
          type="text"
          placeholder="Target ID"
          className="w-44 bg-white"
          defaultValue={currentFilters.resourceId ?? ""}
          onBlur={(event) => updateFilter("resourceId", event.target.value || undefined)}
        />
        <Input
          type="text"
          placeholder="Subject ID"
          className="w-44 bg-white"
          defaultValue={currentFilters.subjectId ?? ""}
          onBlur={(event) => updateFilter("subjectId", event.target.value || undefined)}
        />
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Reset filters
        </Button>
        <span className="ml-auto text-sm text-slate-500">
          {total} event{total !== 1 ? "s" : ""} in this clinical workspace
        </span>
      </div>
    </div>
  );
};
