export default function ScheduleToggle({ mode, onChange }) {
  const isDynamic = mode === 'dynamic';

  return (
    <div className="rounded-xl border border-pulse-border bg-pulse-bg p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        Schedule Mode
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange('static')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            !isDynamic
              ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Standard Static
        </button>
        <button
          type="button"
          onClick={() => onChange('dynamic')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isDynamic
              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Dynamic AI
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {isDynamic
          ? 'Headways adapt from logged congestion patterns.'
          : 'Fixed timetable — no demand response.'}
      </p>
    </div>
  );
}
