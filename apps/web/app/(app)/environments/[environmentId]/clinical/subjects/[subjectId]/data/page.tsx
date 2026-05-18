import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { withReadEventScope } from "@/modules/clinical/audit/lib/dedupe-read-event";
import { getSubjectDataEntry } from "@/modules/clinical/records/lib/record-queries";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { EventTabs } from "./components/event-tabs";
import { InstrumentCard } from "./components/instrument-card";
import { RepeatingInstrumentTable } from "./components/repeating-instrument-table";

interface SubjectDataPageProps {
  params: Promise<{ environmentId: string; subjectId: string }>;
  searchParams: Promise<{ event?: string }>;
}

const SubjectDataPage = async ({ params, searchParams }: SubjectDataPageProps) => {
  const { environmentId, subjectId } = await params;
  const { event } = await searchParams;
  const data = await withReadEventScope(() => getSubjectDataEntry(environmentId, subjectId, event));
  if (!data) notFound();

  const selectedEvent = data.events.find((item) => item.id === data.selectedEventId) ?? null;
  const armId = data.subject.enrollment?.armId;

  return (
    <PageContentWrapper className="space-y-6 pb-24">
      {/* Context breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href={`/environments/${environmentId}/clinical/subjects?view=dashboard${armId ? `&armId=${armId}` : ""}`}
          className="flex items-center gap-1 hover:text-slate-700">
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          Data Entry
        </Link>
        <span>/</span>
        <Link
          href={`/environments/${environmentId}/clinical/subjects/${subjectId}`}
          className="hover:text-slate-700">
          {data.subject.externalId}
        </Link>
        {selectedEvent && (
          <>
            <span>/</span>
            <span className="text-slate-700">{selectedEvent.name}</span>
          </>
        )}
      </div>

      {/* Subject + enrollment context */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{data.subject.externalId}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.subject.enrollment
            ? `${data.subject.enrollment.armName} · Status: ${data.subject.enrollment.status}`
            : "No enrollment recorded for this subject yet."}
        </p>
      </div>

      <EventTabs
        environmentId={environmentId}
        subjectId={subjectId}
        events={data.events}
        selectedEventId={data.selectedEventId}
      />

      {!data.subject.enrollment ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Assign this subject to an arm before starting data entry.
        </div>
      ) : !selectedEvent ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No scheduled events are available for {data.subject.enrollment.armName}.
        </div>
      ) : selectedEvent.instruments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          <p className="font-medium text-slate-700">No forms assigned to {selectedEvent.name}.</p>
          <p className="mt-1">
            Go to <strong>Protocol → matrix</strong> and check which forms should be collected at this event.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedEvent.instruments.map((binding) =>
            binding.repeating ? (
              <RepeatingInstrumentTable
                key={binding.instrument.id}
                environmentId={environmentId}
                subjectId={subjectId}
                binding={binding}
              />
            ) : (
              <InstrumentCard key={binding.instrument.id} environmentId={environmentId} subjectId={subjectId} binding={binding} />
            )
          )}
        </div>
      )}
    </PageContentWrapper>
  );
};

export default SubjectDataPage;
