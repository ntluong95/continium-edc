import { Users } from "lucide-react";

interface SubjectSummaryCardsProps {
  statusCounts: {
    total: number;
    active: number;
    screened: number;
    completed: number;
    withdrawn: number;
  };
}

const StatCard = ({
  label,
  value,
  dotClass,
  sub,
}: {
  label: string;
  value: number;
  dotClass: string;
  sub: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs transition-shadow hover:shadow-sm">
    <div className="mb-2 flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl font-semibold tabular-nums leading-none text-slate-900">{value}</span>
      <span className="text-xs text-slate-400">{sub}</span>
    </div>
  </div>
);

export const SubjectSummaryCards = ({ statusCounts }: SubjectSummaryCardsProps) => {
  const goalPct = Math.round((statusCounts.total / 60) * 100);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* Featured: total */}
      <div className="col-span-2 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-4 shadow-sm sm:col-span-1 lg:col-span-1">
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-teal-400" />
          <span className="text-xs font-medium uppercase tracking-wide text-white/60">Total subjects</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tabular-nums leading-none text-white">
            {statusCounts.total}
          </span>
          <span className="text-xs text-white/50">enrolled</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/60">
          <span>Target: 60 subjects</span>
          <span className="font-medium text-teal-400">{goalPct}% of goal</span>
        </div>
      </div>

      <StatCard label="Active" value={statusCounts.active} dotClass="bg-emerald-500" sub="on treatment" />
      <StatCard label="Screened" value={statusCounts.screened} dotClass="bg-amber-400" sub="awaiting" />
      <StatCard label="Completed" value={statusCounts.completed} dotClass="bg-blue-500" sub="finished" />
      <StatCard label="Withdrawn" value={statusCounts.withdrawn} dotClass="bg-red-500" sub="discontinued" />
    </div>
  );
};
