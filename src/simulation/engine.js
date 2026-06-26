import { SIM_CONFIG, STOPS, isRushHour, getDailyScheduleOffset } from './config';

let nextPassengerId = 1;

function createFleet(activeCount = SIM_CONFIG.baseFleetSize, totalCount = SIM_CONFIG.maxFleetSize, startId = 1) {
  const buses = [];
  for (let i = 0; i < totalCount; i++) {
    buses.push({
      id: startId + i,
      label: `Bus ${startId + i}`,
      segmentIndex: 0,
      progress: 0,
      remainingSegments: 0,
      passengers: 0,
      isAuxiliary: false,
      active: false,
    });
  }
  return buses;
}

const DAY_MINUTES = 24 * 60;

function getDayStart(simMinutes) {
  return simMinutes - (simMinutes % DAY_MINUTES);
}

function normalizeSchedule(schedule) {
  return schedule
    .slice()
    .sort((a, b) => a.simMinutes - b.simMinutes)
    .map((entry) => ({ ...entry }));
}

function mergeIntervals(intervals) {
  const sorted = intervals
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((interval) => ({ ...interval }));

  const merged = [];
  sorted.forEach((interval) => {
    if (!merged.length || merged[merged.length - 1].end < interval.start) {
      merged.push({ ...interval });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, interval.end);
    }
  });
  return merged;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildPeakWindows(events) {
  if (!events || !events.length) {
    return [
      { start: SIM_CONFIG.rushMorningStart, end: SIM_CONFIG.rushMorningEnd },
      { start: SIM_CONFIG.rushEveningStart, end: SIM_CONFIG.rushEveningEnd },
    ];
  }

  const windows = events.map((event) => ({
    start: clamp(event.simMinutes % DAY_MINUTES - 35, 0, DAY_MINUTES),
    end: clamp(event.simMinutes % DAY_MINUTES + 35, 0, DAY_MINUTES),
  }));
  return mergeIntervals(windows);
}

function scheduleWithinIntervals(dayStart, intervals, count, isAuxiliarySelector) {
  const schedule = [];
  const totalDuration = intervals.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
  if (totalDuration <= 0 || count <= 0) return schedule;

  let remaining = count;
  intervals.forEach((interval, idx) => {
    const duration = interval.end - interval.start;
    const share = Math.max(1, Math.round((duration / totalDuration) * count));
    const slots = Math.min(remaining, share);
    if (slots <= 0) return;

    const step = duration / slots;
    for (let i = 0; i < slots; i++) {
      const time = Math.round(dayStart + interval.start + step * (i + 0.5));
      schedule.push({
        simMinutes: time,
        deployed: false,
        isAuxiliary: isAuxiliarySelector ? isAuxiliarySelector(idx, i, slots) : false,
      });
    }
    remaining -= slots;
  });

  if (remaining > 0) {
    const last = intervals[intervals.length - 1];
    for (let i = 0; i < remaining; i++) {
      schedule.push({
        simMinutes: Math.round(dayStart + last.end - i - 1),
        deployed: false,
        isAuxiliary: false,
      });
    }
  }

  return normalizeSchedule(schedule).slice(0, count);
}

function invertIntervals(intervals, boundary = DAY_MINUTES) {
  const result = [];
  let cursor = 0;
  const merged = mergeIntervals(intervals);

  merged.forEach((interval) => {
    if (interval.start > cursor) {
      result.push({ start: cursor, end: interval.start });
    }
    cursor = interval.end;
  });

  if (cursor < boundary) {
    result.push({ start: cursor, end: boundary });
  }

  return result;
}

function generateStaticDeploymentSchedule(dayStart, totalDeployments, windowStart) {
  const scheduleStart = windowStart ?? dayStart;
  const duration = DAY_MINUTES - (scheduleStart - dayStart);
  const interval = duration / totalDeployments;
  const schedule = [];

  for (let i = 0; i < totalDeployments; i++) {
    const time = Math.round(scheduleStart + interval * (i + 0.5));
    schedule.push({ simMinutes: Math.min(dayStart + DAY_MINUTES - 1, time), deployed: false, isAuxiliary: false });
  }

  return normalizeSchedule(schedule);
}

function generateDynamicDeploymentSchedule(dayStart, totalDeployments, events, windowStart) {
  const scheduleStart = windowStart ?? dayStart;
  const startOffset = scheduleStart - dayStart;
  const peakWindows = buildPeakWindows(events || []);
  const peakIntervals = peakWindows
    .map((w) => ({
      start: Math.max(0, w.start),
      end: Math.min(DAY_MINUTES, w.end),
    }))
    .map((interval) => ({
      start: Math.max(0, interval.start - startOffset),
      end: Math.max(0, interval.end - startOffset),
    }))
    .filter((interval) => interval.end > interval.start);
  const offPeakIntervals = invertIntervals(peakIntervals, DAY_MINUTES - startOffset).map((interval) => ({
    start: Math.max(0, interval.start),
    end: Math.max(0, interval.end),
  }));

  const peakDeployments = Math.max(1, Math.round(totalDeployments * 0.6));
  const offPeakDeployments = totalDeployments - peakDeployments;

  const peakSchedule = scheduleWithinIntervals(scheduleStart, peakIntervals, peakDeployments, (intervalIdx, itemIdx, slots) => {
    return slots > 1 && itemIdx >= slots - 2;
  });
  const offPeakSchedule = scheduleWithinIntervals(scheduleStart, offPeakIntervals, offPeakDeployments, () => false);

  return normalizeSchedule([...peakSchedule, ...offPeakSchedule]);
}

function generateDeploymentSchedule(currentSimMinutes, scheduleMode, previousDayEvents = []) {
  const dayStart = getDayStart(currentSimMinutes);
  const scheduleStart = currentSimMinutes > dayStart ? currentSimMinutes : dayStart;
  const totalDeployments = SIM_CONFIG.deploymentLimitPerDay;

  if (scheduleMode === 'dynamic') {
    if (!previousDayEvents || !previousDayEvents.length) {
      return generateStaticDeploymentSchedule(dayStart, totalDeployments, scheduleStart);
    }
    return generateDynamicDeploymentSchedule(dayStart, totalDeployments, previousDayEvents, scheduleStart);
  }

  return generateStaticDeploymentSchedule(dayStart, totalDeployments, scheduleStart);
}

export function createInitialState() {
  nextPassengerId = 1;
  const initialSimMinutes = 7 * 60;
  const initialScheduleMode = 'static';
  const initialSchedule = generateDeploymentSchedule(initialSimMinutes, initialScheduleMode, []);

  return {
    simMinutes: initialSimMinutes,
    scheduleOffsetMinutes: getDailyScheduleOffset(0),
    scheduleMode: initialScheduleMode,
    pendingScheduleMode: null,
    deploymentSchedule: initialSchedule,
    deploymentsToday: 0,
    buses: createFleet(),
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
    staticWaitHistory: [],
    congestionEvents: [],
    optimizations: [],
    scheduledOptimizations: [],
    auxiliaryBusScheduled: false,
    dayCount: 0,
  };
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
    let rate = 0.02;

    if (morningRush) {
      rate = stop.id === 4 ? 0.75 : stop.id === 3 ? 0.38 : 0.28;
    } else if (middayRush) {
      rate = stop.id === 3 ? 0.48 : stop.id === 5 ? 0.42 : 0.24;
    } else if (eveningRush) {
      rate = stop.id === 4 ? 0.36 : stop.id === 6 ? 0.65 : stop.id === 8 ? 0.48 : 0.24;
    }

    if (Math.random() >= rate) return;

    const batch =
      stop.id === 4 && morningRush && Math.random() < 0.5
        ? 3
        : stop.id === 6 && eveningRush && Math.random() < 0.45
        ? 3
        : stop.id === 8 && eveningRush && Math.random() < 0.35
        ? 2
        : 1;

    for (let i = 0; i < batch; i++) {
      stop.waiting.push({ id: nextPassengerId++, waitSince: simMinutes });
    }
  });
}

function processStopVisit(bus, stop, simMinutes) {
  const alightFraction = 0.4;
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
  const segmentMinutes = SIM_CONFIG.staticSegmentMinutes;

  buses.forEach((bus) => {
    if (!bus.active) return;
    bus.progress += SIM_CONFIG.minutesPerTick / segmentMinutes;

    while (bus.progress >= 1 && bus.active) {
      bus.progress -= 1;
      bus.segmentIndex = (bus.segmentIndex + 1) % STOPS.length;
      bus.remainingSegments = Math.max(0, bus.remainingSegments - 1);
      const stop = stops[bus.segmentIndex];
      if (stop) processStopVisit(bus, stop, simMinutes);

      if (bus.remainingSegments === 0) {
        bus.active = false;
        bus.isAuxiliary = false;
        break;
      }
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

  const activeBuses = buses.filter((b) => b.active);
  const totalActiveCapacity = Math.max(1, activeBuses.length * SIM_CONFIG.busCapacity);
  const loadFactor = buses.reduce((sum, b) => sum + b.passengers, 0) / totalActiveCapacity;
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
  const clonedBuses = buses.map((bus) => ({
    ...bus,
    remainingSegments: bus.remainingSegments || STOPS.length,
  }));

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

  if (scheduleMode === 'static') {
    return rush ? SIM_CONFIG.baseHeadwayMinutes : SIM_CONFIG.offPeakHeadwayMinutes;
  }

  const activeOpt = optimizations.some((o) => o.active);
  if (rush) return SIM_CONFIG.dynamicHeadwayMinutes;
  return SIM_CONFIG.offPeakHeadwayMinutes;
}

function activateReserveBus(buses, segmentIndex = 2, progress = 0.35) {
  const reserve = buses.find((bus) => !bus.active);
  if (!reserve) return null;
  reserve.active = true;
  reserve.isAuxiliary = true;
  reserve.segmentIndex = segmentIndex;
  reserve.progress = progress;
  reserve.passengers = 0;
  return reserve;
}

function deactivateAuxiliaryBus(buses) {
  const activeAux = buses.find((bus) => bus.active && bus.isAuxiliary);
  if (!activeAux) return null;
  activeAux.active = false;
  activeAux.isAuxiliary = false;
  activeAux.passengers = 0;
  return activeAux;
}

function updateRegularFleetActivation(buses, targetActive) {
  const regular = buses.filter((bus) => !bus.isAuxiliary).sort((a, b) => a.id - b.id);
  const activeRegular = regular.filter((bus) => bus.active);
  const inactiveRegular = regular.filter((bus) => !bus.active);

  if (activeRegular.length < targetActive) {
    inactiveRegular.slice(0, targetActive - activeRegular.length).forEach((bus) => {
      bus.active = true;
    });
  } else if (activeRegular.length > targetActive) {
    activeRegular
      .slice(targetActive)
      .forEach((bus) => {
        bus.active = false;
      });
  }
}

export function runOptimizationTick(state) {
  const { deploymentSchedule = [], buses, simMinutes } = state;
  let next = { ...state, deploymentSchedule: deploymentSchedule.map((entry) => ({ ...entry })) };

  next.deploymentSchedule = next.deploymentSchedule.map((entry) => {
    if (entry.deployed || simMinutes < entry.simMinutes) return entry;

    const bus = next.buses.find((b) => !b.active);
    if (!bus) {
      return { ...entry, deployed: true };
    }

    bus.active = true;
    bus.segmentIndex = 0;
    bus.progress = 0;
    bus.remainingSegments = STOPS.length;
    bus.passengers = 0;
    bus.isAuxiliary = entry.isAuxiliary || false;

    next.deploymentsToday = (next.deploymentsToday || 0) + 1;
    return { ...entry, deployed: true };
  });

  return next;
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
  const dayLabel = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][newDayIndex];
  const currentMode = prevState.scheduleMode;
  const nextMode = prevState.pendingScheduleMode || currentMode;
  const prevDayIndex = (newDayIndex + 6) % 7;
  const previousEvents = prevState.congestionEvents.filter((e) => e.dayIndex === prevDayIndex);

  let next = {
    ...prevState,
    scheduleOffsetMinutes: getDailyScheduleOffset(newDayIndex),
    dayCount: prevState.dayCount + 1,
    scheduleMode: nextMode,
    pendingScheduleMode: null,
    deploymentSchedule: generateDeploymentSchedule(prevState.simMinutes, nextMode, previousEvents),
    deploymentsToday: 0,
  };

  if (prevState.pendingScheduleMode && prevState.pendingScheduleMode !== currentMode) {
    next.logs = addLog(
      next.logs,
      dayLabel,
      '12:00 AM',
      'optimization',
      `Schedule mode switched to ${nextMode.toUpperCase()} at day boundary.`,
      prevState.simMinutes
    );
  }

  if (nextMode === 'dynamic' && previousEvents.length > 0) {
    next.logs = addLog(
      next.logs,
      dayLabel,
      '12:00 AM',
      'optimization',
      `Adaptive deployment schedule generated for today from yesterday's congestion data (${previousEvents.length} bottleneck events).`,
      prevState.simMinutes
    );
  } else if (nextMode === 'dynamic') {
    next.logs = addLog(
      next.logs,
      dayLabel,
      '12:00 AM',
      'info',
      'Dynamic mode continues with baseline deployment schedule until congestion patterns are logged.',
      prevState.simMinutes
    );
  } else {
    next.logs = addLog(
      next.logs,
      dayLabel,
      '12:00 AM',
      'info',
      'Standard static schedule reset for the new day.',
      prevState.simMinutes
    );
  }

  return next;
}

export function applyScheduleModeChange(state, mode) {
  if (mode !== 'dynamic') return state;

  const stop4 = state.stops.find((s) => s.id === 4);
  const congested = stop4 && stop4.waiting.length >= SIM_CONFIG.congestionThreshold;
  if (!congested || state.buses.some((b) => b.isAuxiliary)) return state;

  const reserveBus = activateReserveBus(state.buses, 2, 0.45);
  if (!reserveBus) return state;

  return {
    ...state,
    auxiliaryBusScheduled: true,
    optimizations: [
      ...state.optimizations,
      {
        id: Date.now(),
        active: true,
        stopId: 4,
        description: `Activated ${reserveBus.label} on dynamic schedule start`,
      },
    ],
    logs: addLog(
      state.logs,
      formatDay(state.simMinutes),
      formatClock(state.simMinutes),
      'optimization',
      `Activated ${reserveBus.label} while entering Dynamic mode due to Stop #4 congestion.`,
      state.simMinutes
    ),
  };
}
