export default function DailyOverview({ overview, onContinue }) {
  if (!overview) return null;

  const {
    dayLabel,
    previousDayLabel,
    congestionIncidents,
    previousCongestionIncidents,
    deploymentCount,
    topStops,
    avgPassengersWaiting,
    previousDayAvgWaiting,
    improvementLabel,
  } = overview;

  const previousDay = typeof previousDayAvgWaiting === 'number';
  let feedbackColor;
  let previousColor;

  if (previousDay) {
    feedbackColor = avgPassengersWaiting < previousDayAvgWaiting ? 'text-emerald-400' : 'text-rose-400';
    previousColor = 'text-amber-400';
  } else {
    feedbackColor = 'text-rose-400';
    previousColor = 'text-slate-400';
  }; 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-pulse-border bg-pulse-panel p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              End of day overview
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {dayLabel} summary
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Compared against {previousDayLabel} to show daily improvement.
            </p>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Continue
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Congestion incidents today</p>
            <p className="mt-2 text-3xl font-semibold text-white">{congestionIncidents}</p>
            <p className="mt-2 text-sm text-slate-400">{improvementLabel}</p>
          </div>

          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Bus deployments</p>
            <p className="mt-2 text-3xl font-semibold text-white">{deploymentCount}</p>
            <p className="mt-2 text-sm text-slate-400">Total buses released across the day.</p>
          </div>

          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Avg passengers waiting</p>
            <p className={`mt-2 text-3xl font-semibold ${feedbackColor}`}>{avgPassengersWaiting.toFixed(1)} passengers</p>
            <p className="mt-2 text-sm text-slate-400">Average number of passengers waiting across stops throughout the day.</p>
          </div>

          <div className="rounded-2xl bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Previous day's average waiting</p>
            <p className={`mt-2 text-3xl font-semibold ${previousColor}`}>
              {typeof previousDayAvgWaiting === 'number' ? `${previousDayAvgWaiting.toFixed(1)} passengers` : 'N/A'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {previousDayLabel} average waiting count for comparison.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">Top congestion locations</p>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
              {topStops.length} stops
            </span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {topStops.length > 0 ? (
              topStops.map((stop) => (
                <li key={stop.stopName} className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
                  <span>{stop.stopName}</span>
                  <span className="font-semibold text-white">{stop.count}</span>
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-slate-900/80 px-3 py-2 text-slate-400">
                No congestion incidents recorded.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
