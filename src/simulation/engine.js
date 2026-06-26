import { SIM_CONFIG, STOPS, isRushHour, getDailyScheduleOffset } from './config';

let nextPassengerId = 1;

export function createInitialState() {
  nextPassengerId = 1;
  return {
    simMinutes: 7 * 60,
    scheduleOffsetMinutes: getDailyScheduleOffset(0),
    scheduleMode: 'static',
    buses: createFleet(4),
    stops: STOPS.map((stop) => ({
      ...stop,
      waiting: [],
      totalBoarded: 0,
      peakWait: 0,
    })),
    logs: [
      {
        id: 1,
        day: 'MON',
        time: '7:00 AM',
        type: 'info',
        message: 'Simulation initialized — Standard Static Schedule active.',
      },
    ],
    waitTimeHistory: [],
    congestionEvents: [],
    optimizations: [],
    auxiliaryBusScheduled: false,
    dayCount: 0,
  };
}

function createFleet(count, startId = 1) {
  const buses = [];
  for (let i = 0; i < count; i++) {
    buses.push({
      id: startId + i,
      label: `Bus ${startId + i}`,
      segmentIndex: i % STOPS.length,
      progress: (i / count) * 0.85,
      passengers: 0,
      isAuxiliary: false,
      direction: 1,
    });
  }
  return buses;
}

export function spawnPassengers(stops, simMinutes, scheduleOffsetMinutes = 0) {
  const adjustedMinutes = (simMinutes + scheduleOffsetMinutes + 24 * 60) % (24 * 60);
  const morningRush =
    adjustedMinutes >= SIM_CONFIG.rushMorningStart &&
    adjustedMinutes <= SIM_CONFIG.rushMorningEnd;
  const middayRush =
    adjustedMinutes >= SIM_CONFIG.middayRushStart &&
    adjustedMinutes <= SIM_CONFIG.middayRushEnd;
  const eveningRush =
    adjustedMinutes >= SIM_CONFIG.rushEveningStart &&
    adjustedMinutes <= SIM_CONFIG.rushEveningEnd;

  stops.forEach((stop) => {
    let rate = 0.06;

    if (morningRush) {
      rate = stop.id === 4 ? 0.42 : stop.id === 3 ? 0.18 : 0.14;
    } else if (middayRush) {
      rate = stop.id === 3 ? 0.24 : stop.id === 5 ? 0.2 : 0.12;
    } else if (eveningRush) {
      rate = stop.id === 4 ? 0.18 : stop.id === 6 ? 0.32 : stop.id === 8 ? 0.22 : 0.12;
    }

    if (Math.random() >= rate) return;

    const batch =
      stop.id === 4 && morningRush && Math.random() < 0.35
        ? 2
        : stop.id === 6 && eveningRush && Math.random() < 0.3
        ? 2
        : stop.id === 8 && eveningRush && Math.random() < 0.2
        ? 2
        : 1;

    for (let i = 0; i < batch; i++) {
      stop.waiting.push({ id: nextPassengerId++, waitSince: simMinutes });
    }
  });
}

function processStopVisit(bus, stop, simMinutes, scheduleMode) {
  const alightFraction = scheduleMode === 'dynamic' ? 0.65 : 0.4;
  const alighting = Math.min(bus.passengers, Math.max(1, Math.ceil(bus.passengers * alightFraction)));
  bus.passengers = Math.max(0, bus.passengers - alighting);

  const capacity = SIM_CONFIG.busCapacity - bus.passengers;
  const boarding = stop.waiting.splice(0, capacity);
  bus.passengers += boarding.length;
  stop.totalBoarded += boarding.length;

  boarding.forEach((p) => {
    const wait = simMinutes - p.waitSince;
    if (wait > stop.peakWait) stop.peakWait = wait;
  });
}

export function moveBuses(buses, stops, simMinutes, scheduleMode) {
  const minutesOfDay = simMinutes % (24 * 60);
  const rush = isRushHour(minutesOfDay);

  let segmentMinutes = SIM_CONFIG.staticSegmentMinutes;
  if (scheduleMode === 'dynamic') {
    segmentMinutes = rush
      ? SIM_CONFIG.dynamicSegmentMinutes
      : SIM_CONFIG.offPeakSegmentMinutes;
  }

  buses.forEach((bus) => {
    const speedMult = bus.isAuxiliary && rush ? 1.2 : 1;
    bus.progress += (SIM_CONFIG.minutesPerTick / segmentMinutes) * speedMult;

    while (bus.progress >= 1) {
      bus.progress -= 1;
      bus.segmentIndex = (bus.segmentIndex + 1) % STOPS.length;
      const stop = stops[bus.segmentIndex];
      if (stop) processStopVisit(bus, stop, simMinutes, scheduleMode);
    }
  });
}

export function computeMetrics(stops, buses, simMinutes) {
  const allWaiting = stops.reduce((sum, s) => sum + s.waiting.length, 0);
  const avgWait =
    allWaiting > 0
      ? stops.reduce(
          (sum, s) =>
            sum + s.waiting.reduce((ws, p) => ws + (simMinutes - p.waitSince), 0),
          0
        ) / allWaiting
      : 0;

  const loadFactor =
    buses.reduce((sum, b) => sum + b.passengers, 0) /
    Math.max(1, buses.length * SIM_CONFIG.busCapacity);
  const utilization = Math.round(loadFactor * 100);

  const satisfaction = Math.max(5, Math.min(100, 98 - avgWait * 3.2 - allWaiting * 1.1));

  return {
    avgWaitTime: Math.round(avgWait * 10) / 10,
    fleetUtilization: utilization,
    passengerSatisfaction: Math.round(satisfaction),
    totalWaiting: allWaiting,
  };
}

export function computeStaticComparison(stops, buses, simMinutes) {
  const clonedStops = stops.map((stop) => ({
    ...stop,
    waiting: stop.waiting.slice(),
  }));
  const clonedBuses = buses.map((bus) => ({ ...bus }));

  moveBuses(clonedBuses, clonedStops, simMinutes, 'static');
  return computeMetrics(clonedStops, clonedBuses, simMinutes);
}

export function detectCongestion(stops, simMinutes, dayIndex) {
  const events = [];
  stops.forEach((stop) => {
    if (stop.waiting.length >= SIM_CONFIG.congestionThreshold) {
      events.push({
        stopId: stop.id,
        stopName: stop.name,
        count: stop.waiting.length,
        simMinutes,
        dayIndex,
      });
    }
  });
  return events;
}

export function addLog(logs, day, time, type, message, simMinutes) {
  return [
    ...logs.slice(-80),
    {
      id: Date.now() + Math.random(),
      day,
      time,
      type,
      message,
      simMinutes,
    },
  ];
}

export function createAuxiliaryBus(existingBuses, segmentIndex = 2, progress = 0.35) {
  const maxId = Math.max(...existingBuses.map((b) => b.id), 0);
  return {
    id: maxId + 1,
    label: `Bus ${maxId + 1}`,
    segmentIndex,
    progress,
    passengers: 0,
    isAuxiliary: true,
    direction: 1,
  };
}

export function getHeadwayForMode(scheduleMode, simMinutes, optimizations) {
  const minutesOfDay = simMinutes % (24 * 60);
  const rush = isRushHour(minutesOfDay);

  if (scheduleMode === 'static') return SIM_CONFIG.baseHeadwayMinutes;

  const activeOpt = optimizations.some((o) => o.active);
  if (activeOpt && rush) return SIM_CONFIG.dynamicHeadwayMinutes;
  if (rush) return SIM_CONFIG.dynamicHeadwayMinutes;
  return SIM_CONFIG.offPeakHeadwayMinutes;
}

export function runOptimizationTick(state) {
  const { scheduleMode, stops, buses, logs, simMinutes } = state;
  if (scheduleMode !== 'dynamic') return state;

  const bottleneckStop = stops.find((s) => s.id === 4);
  const hasSevereCongestion =
    bottleneckStop && bottleneckStop.waiting.length >= SIM_CONFIG.severeThreshold;

  if (hasSevereCongestion && !state.auxiliaryBusScheduled) {
    const newBus = createAuxiliaryBus(buses, 2, 0.2);
    return {
      ...state,
      buses: [...buses, newBus],
      auxiliaryBusScheduled: true,
      optimizations: [
        ...state.optimizations,
        {
          id: Date.now(),
          active: true,
          stopId: 4,
          description: `Auxiliary ${newBus.label} deployed to Stop #4 bottleneck`,
        },
      ],
      logs: addLog(
        logs,
        formatDay(simMinutes),
        formatClock(simMinutes),
        'optimization',
        `Deploying auxiliary ${newBus.label} ahead of Stop #4 rush-hour surge.`
      ),
    };
  }

  return state;
}

function formatDay(simMinutes) {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return days[Math.floor(simMinutes / (24 * 60)) % 7];
}

function formatClock(simMinutes) {
  const m = simMinutes % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const dh = h % 12 || 12;
  return `${dh}:${min.toString().padStart(2, '0')} ${ampm}`;
}

export function onDayTransition(prevState, newDayIndex) {
  const { congestionEvents, scheduleMode, buses } = prevState;
  const dayLabel = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][newDayIndex];

  let next = {
    ...prevState,
    scheduleOffsetMinutes: getDailyScheduleOffset(newDayIndex),
    dayCount: prevState.dayCount + 1,
    auxiliaryBusScheduled: false,
  };

  if (scheduleMode === 'dynamic') {
    const stop4Events = congestionEvents.filter((e) => e.stopId === 4);

    if (stop4Events.length > 0) {
      const hasAuxiliary = buses.some((b) => b.isAuxiliary);
      const updatedBuses = hasAuxiliary
        ? buses
        : [...buses, createAuxiliaryBus(buses, 2, 0.55)];

      next = {
        ...next,
        buses: updatedBuses,
        optimizations: [
          ...next.optimizations.map((o) => ({ ...o, active: true })),
          {
            id: Date.now(),
            active: true,
            stopId: 4,
            description: 'Reduced headway during morning rush at Stop #4',
          },
        ],
        logs: addLog(
          next.logs,
          dayLabel,
          '6:45 AM',
          'optimization',
          `Pre-positioning backup vehicle for Stop #4 — ${stop4Events.length} congestion events logged yesterday.`
        ),
      };
    } else {
      next = {
        ...next,
        logs: addLog(
          next.logs,
          dayLabel,
          '12:00 AM',
          'info',
          'Day rollover: Dynamic schedule maintained — no new bottlenecks detected.'
        ),
      };
    }
  } else {
    next = {
      ...next,
      logs: addLog(
        next.logs,
        dayLabel,
        '12:00 AM',
        'alert',
        'Static schedule unchanged — recurring congestion expected at Stop #4.'
      ),
    };
  }

  return next;
}

export function applyScheduleModeChange(state, mode) {
  if (mode !== 'dynamic') return state;

  const stop4 = state.stops.find((s) => s.id === 4);
  const congested = stop4 && stop4.waiting.length >= SIM_CONFIG.congestionThreshold;
  if (!congested || state.buses.some((b) => b.isAuxiliary)) return state;

  const newBus = createAuxiliaryBus(state.buses, 2, 0.45);
  return {
    ...state,
    buses: [...state.buses, newBus],
    auxiliaryBusScheduled: true,
    optimizations: [
      ...state.optimizations,
      { id: Date.now(), active: true, stopId: 4, description: 'Immediate rush response at Stop #4' },
    ],
  };
}
