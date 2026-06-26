const METRICS = [
  { key: 'day', label: 'Day of Week', suffix: '', color: 'text-white' },
  { key: 'avgPassengersWaiting', label: 'Avg Passengers Waiting', suffix: ' pax', color: 'text-amber-400' },
  { key: 'fleetUtilization', label: 'Fleet Utilization', suffix: '%', color: 'text-cyan-400' },
  { key: 'passengerSatisfaction', label: 'Passenger Satisfaction', suffix: '%', color: 'text-emerald-400' },
];

export default function MetricsGrid({ formatted, metrics, staticComparison }) {
  const values = {
    day: `${formatted.day} · ${formatted.time}`,
    avgPassengersWaiting: metrics.avgPassengersWaiting,
    fleetUtilization: metrics.fleetUtilization,
    passengerSatisfaction: metrics.passengerSatisfaction,
  };

  const staticDelta =
    staticComparison != null
      ? Math.round((metrics.avgPassengersWaiting - staticComparison.avgPassengersWaiting) * 10) / 10
      : null;
  const deltaText = staticDelta === 0 ? '±0 pax' : staticDelta > 0 ? `+${staticDelta} pax` : `${staticDelta} pax`;
  const deltaColor = staticDelta > 0 ? 'text-rose-400' : 'text-emerald-400';

  return (
    <div className="grid grid-cols-2 gap-3">
      {METRICS.map(({ key, label, suffix, color }) => (
        <div
          key={key}
          className="rounded-xl border border-pulse-border bg-pulse-bg px-4 py-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className={`mt-1 font-mono text-xl font-bold ${color}`}>
            {values[key]}
            {key !== 'day' && suffix}
          </p>
        </div>
      ))}
      {staticComparison && (
        <div className="rounded-xl border border-pulse-border bg-pulse-bg px-4 py-3 col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Static Schedule Avg Waiting
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-slate-200">
                {staticComparison.avgPassengersWaiting} pax
              </p>
            </div>
            <div className={`rounded-full border px-2 py-1 text-xs font-semibold ${deltaColor}`}>
              {deltaText}
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Comparison to a non-optimized static schedule.
          </p>
        </div>
      )}
    </div>
  );
}
