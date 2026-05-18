"use client";

import { InstrumentStatus } from "@prisma/client";
import Link from "next/link";
import { useTransition } from "react";
import { PublishDialog } from "@/modules/clinical/instruments/components/publish-dialog";
import {
  archiveInstrumentAction,
  cloneAsNewDraftAction,
} from "@/modules/clinical/instruments/lib/instrument-actions";
import type { TInstrumentDashboard } from "@/modules/clinical/instruments/lib/instrument-queries";
import {
  INSTRUMENT_STATUS_BADGES,
  INSTRUMENT_STATUS_LABELS,
} from "@/modules/clinical/instruments/lib/instrument-status";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Badge } from "@/modules/ui/components/badge";
import { Button } from "@/modules/ui/components/button";

type InstrumentVersion = TInstrumentDashboard["surveyGroups"][number]["versions"][number];

interface InstrumentVersionRowProps {
  environmentId: string;
  version: InstrumentVersion;
  surveyId?: string;
  surveyName?: string;
}

const InstrumentVersionRow = ({
  environmentId,
  version,
  surveyId,
  surveyName,
}: InstrumentVersionRowProps) => {
  const { handleResult } = useActionToast();
  const [isArchiving, startArchive] = useTransition();
  const [isCloning, startClone] = useTransition();

  const handleArchive = () => {
    startArchive(async () => {
      const result = await archiveInstrumentAction({ environmentId, data: { instrumentId: version.id } });
      handleResult(result, `Instrument v${version.version} archived.`);
    });
  };

  const handleClone = () => {
    startClone(async () => {
      const result = await cloneAsNewDraftAction({
        environmentId,
        data: { instrumentId: version.id },
      });
      handleResult(result, `New draft created from v${version.version}.`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-800">
            v{version.version}
            {surveyName && <span className="ml-1 font-normal text-slate-500"> - {surveyName}</span>}
          </span>
          <Badge
            text={INSTRUMENT_STATUS_LABELS[version.status]}
            type={INSTRUMENT_STATUS_BADGES[version.status]}
            size="tiny"
          />
          {version.sourceSurveyChanged && <Badge text="Survey changed" type="warning" size="tiny" />}
        </div>
        <p className="text-xs text-slate-500">
          {version.fieldCount} field{version.fieldCount !== 1 ? "s" : ""}
          {version.publishedAt ? ` - Published ${new Date(version.publishedAt).toLocaleDateString()}` : ""}
          {version.boundEventCount > 0
            ? ` - Used in ${version.boundEventCount} event binding${version.boundEventCount !== 1 ? "s" : ""}`
            : ""}
        </p>
        {version.sourceSurveyChanged && version.status === InstrumentStatus.DRAFT && (
          <p className="text-xs text-amber-700">
            The source survey has changed since this draft was created. Create a new draft from the current
            survey before publishing.
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {surveyId ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/environments/${environmentId}/forms/${surveyId}/edit`}>Open form</Link>
          </Button>
        ) : (
          <Badge text="Registry only" type="gray" size="tiny" />
        )}
        {version.status === InstrumentStatus.DRAFT && (
          <PublishDialog
            environmentId={environmentId}
            instrumentId={version.id}
            instrumentName={version.displayName ?? version.name}
            diff={version.diff}
            sourceSurveyChanged={version.sourceSurveyChanged}
            unsupportedFieldTypes={version.unsupportedFieldTypes}
          />
        )}
        {version.status === InstrumentStatus.PUBLISHED && (
          <>
            <Button
              size="sm"
              variant="outline"
              loading={isCloning}
              disabled={isArchiving}
              onClick={handleClone}>
              Edit as new draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={isArchiving}
              disabled={isCloning || version.boundEventCount > 0}
              title={
                version.boundEventCount > 0
                  ? `Cannot archive: bound to ${version.boundEventCount} event binding${version.boundEventCount !== 1 ? "s" : ""}`
                  : undefined
              }
              onClick={handleArchive}>
              Archive
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

interface InstrumentListProps {
  environmentId: string;
  dashboard: TInstrumentDashboard;
}

export const InstrumentList = ({ environmentId, dashboard }: InstrumentListProps) => {
  const { surveyGroups, standaloneVersions } = dashboard;
  const hasContent = surveyGroups.some((group) => group.versions.length > 0) || standaloneVersions.length > 0;

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No clinical forms yet. Complete project template setup or create a draft from an existing survey.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {standaloneVersions.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Project template forms</h3>
          <div className="space-y-2">
            {standaloneVersions.map((version) => (
              <InstrumentVersionRow
                key={version.id}
                environmentId={environmentId}
                version={version}
                surveyName={version.displayName ?? version.name}
              />
            ))}
          </div>
        </section>
      )}

      {surveyGroups
        .filter((group) => group.versions.length > 0)
        .map((group) => (
          <section key={group.survey.id} className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">{group.survey.name}</h3>
            <div className="space-y-2">
              {group.versions.map((version) => (
                <InstrumentVersionRow
                  key={version.id}
                  environmentId={environmentId}
                  version={version}
                  surveyId={group.survey.id}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
};
