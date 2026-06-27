import ScheduleToggle from './ScheduleToggle';
import MetricsGrid from './MetricsGrid';
import ActionLog from './ActionLog';
import WaitTimeChart from './WaitTimeChart';

export default function OptimizationConsole({
  formatted,
  metrics,
  staticComparison,
  staticWaitHistory,
  scheduleMode,
  onScheduleChange,
  logs,
  waitTimeHistory,
  isRunning,
  onToggleRunning,
  speed,
  onSpeedChange,
  onReset,
  deploymentsToday,
  onAddCityEvent,
  eventAddedToday,
}) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <header>
        <h1 className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">
          OmniPulse
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Demand-responsive transit optimization console
        </p>
      </header>

      <ScheduleToggle mode={scheduleMode} onChange={onScheduleChange} />

      <MetricsGrid formatted={formatted} metrics={metrics} staticComparison={staticComparison} deploymentsToday={deploymentsToday} />

      <WaitTimeChart
        history={waitTimeHistory}
        staticWaitHistory={staticWaitHistory}
        scheduleMode={scheduleMode}
      />

      <ActionLog logs={logs} />

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-pulse-border pt-4">
        <button
          type="button"
          onClick={onToggleRunning}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button
          type="button"
          onClick={onAddCityEvent}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            eventAddedToday
              ? 'bg-slate-600 hover:bg-slate-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          Add City Event
        </button>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="rounded-lg border border-pulse-border bg-pulse-bg px-3 py-2 text-sm text-slate-300"
        >
          <option value={0.5}>0.5× speed</option>
          <option value={1}>1× speed</option>
          <option value={2}>2× speed</option>
          <option value={4}>4× speed</option>
        </select>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-pulse-border px-4 py-2 text-sm text-slate-400 hover:text-white"
        >
          Reset Week
        </button>
      </div>
    </div>
  );
}
