import CityMap from './components/CityMap';
import OptimizationConsole from './components/OptimizationConsole';
import DailyOverview from './components/DailyOverview';
import { useSimulation } from './hooks/useSimulation';

export default function App() {
  const {
    state,
    formatted,
    metrics,
    staticComparison,
    stopsWithLevel,
    isRunning,
    setIsRunning,
    speed,
    setSpeed,
    setScheduleMode,
    resetSimulation,
    dailyOverview,
    dismissDailyOverview,
    addCityEvent,
    eventAddedToday,
  } = useSimulation();

  const handleContinue = () => {
    dismissDailyOverview();
    setIsRunning(true);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-pulse-bg text-white">
      <div className="relative w-[60%] border-r border-pulse-border">
        <CityMap
          stopsWithLevel={stopsWithLevel}
          buses={state.buses}
          formatted={formatted}
        />
      </div>
      <div className="w-[40%] bg-pulse-panel">
        <OptimizationConsole
          formatted={formatted}
          metrics={metrics}
          staticComparison={staticComparison}
          staticWaitHistory={state.staticWaitHistory}
          scheduleMode={state.scheduleMode}
          onScheduleChange={setScheduleMode}
          logs={state.logs}
          waitTimeHistory={state.waitTimeHistory}
          isRunning={isRunning}
          onToggleRunning={() => setIsRunning((r) => !r)}
          speed={speed}
          onSpeedChange={setSpeed}
          onReset={resetSimulation}
          deploymentsToday={state.deploymentsToday}
          onAddCityEvent={addCityEvent}
          eventAddedToday={eventAddedToday}
        />
      </div>
      <DailyOverview overview={dailyOverview} onContinue={handleContinue} />
    </div>
  );
}
