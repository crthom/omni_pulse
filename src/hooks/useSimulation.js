import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SIM_CONFIG,
  formatSimTime,
  getStopCongestionLevel,
} from '../simulation/config';
import {
  createInitialState,
  spawnPassengers,
  moveBuses,
  computeMetrics,
  computeStaticComparison,
  detectCongestion,
  addLog,
  runOptimizationTick,
  onDayTransition,
} from '../simulation/engine';

export function useSimulation() {
  const [state, setState] = useState(createInitialState);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const lastDayRef = useRef(0);

  const tick = useCallback(() => {
    setState((prev) => {
      const simMinutes = prev.simMinutes + SIM_CONFIG.minutesPerTick;
      const formatted = formatSimTime(simMinutes);
      const currentDay = formatted.dayIndex;

      let next = { ...prev, simMinutes };

      if (currentDay !== lastDayRef.current) {
        lastDayRef.current = currentDay;
        next = onDayTransition(next, currentDay);
      }

      next = runOptimizationTick(next);
      spawnPassengers(next.stops, simMinutes, next.scheduleOffsetMinutes);
      moveBuses(next.buses, next.stops, simMinutes, next.scheduleMode);

      // Debug: check for duplicate bus IDs
      const activeBusIds = next.buses.filter(b => b.active).map(b => b.id);
      const uniqueIds = new Set(activeBusIds);
      if (uniqueIds.size !== activeBusIds.length) {
        console.error('Duplicate active bus IDs:', activeBusIds);
      }

      const metrics = computeMetrics(next.stops, next.buses, simMinutes);
      const newCongestion = detectCongestion(next.stops, simMinutes, currentDay);
      const staticComparison = next.scheduleMode === 'dynamic' ? computeStaticComparison(next.stops, next.buses, simMinutes) : null;
      const staticWait = next.scheduleMode === 'dynamic' ? staticComparison.avgPassengersWaiting : metrics.avgPassengersWaiting;

      next = {
        ...next,
        waitTimeHistory: [
          ...next.waitTimeHistory.slice(-120),
          {
            time: formatted.time,
            day: formatted.day,
            wait: metrics.avgPassengersWaiting,
            satisfaction: metrics.passengerSatisfaction,
          },
        ],
        staticWaitHistory:
          next.scheduleMode === 'dynamic'
            ? [
                ...next.staticWaitHistory.slice(-120),
                {
                  time: formatted.time,
                  day: formatted.day,
                  staticWait,
                },
              ]
            : [],
        congestionEvents: [...next.congestionEvents, ...newCongestion],
        dailyPassengerSamples: [...next.dailyPassengerSamples, metrics.totalWaiting],
      };

      const minutesOfDay = simMinutes % (24 * 60);
      const morningRush = 
        minutesOfDay >= SIM_CONFIG.rushMorningStart &&
        minutesOfDay <= SIM_CONFIG.rushMorningEnd;
      const eveningRush =
        minutesOfDay >= SIM_CONFIG.rushEveningStart &&
        minutesOfDay <= SIM_CONFIG.rushEveningEnd;
      function shouldLogAlert(logs, stopId, eventSim) {
        const cooldown = SIM_CONFIG.alertCooldownMinutes || 15;
        for (let i = logs.length - 1; i >= 0; i--) {
          const l = logs[i];
          if (!l || !l.message) continue;
          if (l.type !== 'alert') continue;
          if (l.message.includes(`Stop #${stopId}`) && typeof l.simMinutes === 'number') {
            if (eventSim - l.simMinutes < cooldown) return false;
            break;
          }
        }
        return true;
      }

      if ((morningRush || eveningRush) && newCongestion.length > 0) {
        newCongestion.forEach((event) => {
          const eventSim = event.simMinutes || simMinutes;
          if (!shouldLogAlert(next.logs, event.stopId, eventSim)) return;
          
          // Dynamically state whether it's the morning or evening rush in the log
          const rushLabel = morningRush ? 'morning' : 'evening';
          
          next.logs = addLog(
            next.logs,
            formatted.day,
            formatted.time,
            'alert',
            `Congestion threshold exceeded during ${rushLabel} rush at Stop #${event.stopId} (${event.count} waiting). Logging pattern.`,
            eventSim
          );
        });
      }

      return { ...next, metrics };
    });
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = setInterval(tick, SIM_CONFIG.tickIntervalMs / speed);
    return () => clearInterval(interval);
  }, [isRunning, speed, tick]);

  useEffect(() => {
    if (state.dailyOverview && isRunning) {
      setIsRunning(false);
    }
  }, [state.dailyOverview, isRunning]);

  const setScheduleMode = useCallback((mode) => {
    setState((prev) => {
      const formatted = formatSimTime(prev.simMinutes);
      if (mode === prev.scheduleMode) return prev;

      return {
        ...prev,
        pendingScheduleMode: mode,
        logs: addLog(
          prev.logs,
          formatted.day,
          formatted.time,
          'info',
          `Schedule mode change to ${mode.toUpperCase()} queued for next day boundary.`,
          prev.simMinutes
        ),
      };
    });
  }, []);

  const resetSimulation = useCallback(() => {
    lastDayRef.current = 0;
    setState(createInitialState());
  }, []);

  const formatted = formatSimTime(state.simMinutes);
  const metrics = state.metrics || computeMetrics(state.stops, state.buses, state.simMinutes);
  const staticComparison =
    state.scheduleMode === 'dynamic'
      ? computeStaticComparison(state.stops, state.buses, state.simMinutes)
      : null;

  const stopsWithLevel = state.stops.map((stop) => ({
    ...stop,
    congestionLevel: getStopCongestionLevel(stop.waiting.length),
    waitingCount: stop.waiting.length,
  }));

  const dismissDailyOverview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dailyOverview: null,
    }));
  }, []);

  return {
    state,
    formatted,
    metrics,
    staticComparison,
    staticWaitHistory: state.staticWaitHistory,
    stopsWithLevel,
    isRunning,
    setIsRunning,
    speed,
    setSpeed,
    setScheduleMode,
    resetSimulation,
    dailyOverview: state.dailyOverview,
    dismissDailyOverview,
  };
}
