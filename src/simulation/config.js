export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const STOPS = [
  { id: 1, name: 'Central Station', lng: -122.417, lat: 37.758 },
  { id: 2, name: 'Market & 5th', lng: -122.407, lat: 37.770 },
  { id: 3, name: 'Union Square', lng: -122.400, lat: 37.785 },
  { id: 4, name: 'Chinatown Gate', lng: -122.393, lat: 37.791 },
  { id: 5, name: 'North Beach', lng: -122.403, lat: 37.801 },
  { id: 6, name: 'Fishermans Wharf', lng: -122.415, lat: 37.805 },
  { id: 7, name: 'Marina District', lng: -122.439, lat: 37.802 },
  { id: 8, name: 'Presidio Gate', lng: -122.428, lat: 37.793 },
  { id: 9, name: 'Richmond District', lng: -122.465, lat: 37.785 },
  { id: 10, name: 'Sunset Plaza', lng: -122.490, lat: 37.775 },
];

export const ROUTE_COORDINATES = [
  ...STOPS.map((s) => [s.lng, s.lat]),
  [STOPS[0].lng, STOPS[0].lat],
];

export const SIM_CONFIG = {
  minutesPerTick: 2,
  tickIntervalMs: 400,
  baseHeadwayMinutes: 18,
  dynamicHeadwayMinutes: 8,
  offPeakHeadwayMinutes: 25,
  staticSegmentMinutes: 14,
  offPeakSegmentMinutes: 18,
  busCapacity: 20,
  baseFleetSize: 8,
  dynamicMinActive: 4,
  dynamicRushActive: 8,
  maxFleetSize: 50,
  deploymentLimitPerDay: 50,
  rushMorningStart: 7 * 60,
  rushMorningEnd: 9 * 60 + 30,
  middayRushStart: 12 * 60,
  middayRushEnd: 13 * 60 + 30,
  rushEveningStart: 17 * 60,
  rushEveningEnd: 20 * 60,
  congestionThreshold: 10,
  severeThreshold: 22,
  dailyVariationMinutes: 10,
  alertCooldownMinutes: 15,
};

export function getDailyScheduleOffset(dayIndex) {
  const offsets = [0, 5, -7, 8, -4, 10, -6];
  return offsets[dayIndex % offsets.length];
}

export function formatSimTime(totalMinutes) {
  const dayIndex = Math.floor(totalMinutes / (24 * 60)) % 7;
  const dayMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(dayMinutes / 60);
  const mins = dayMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return {
    day: DAYS[dayIndex],
    dayIndex,
    time: `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`,
    totalMinutes,
  };
}

export function isRushHour(minutesOfDay) {
  const { rushMorningStart, rushMorningEnd, rushEveningStart, rushEveningEnd } = SIM_CONFIG;
  return (
    (minutesOfDay >= rushMorningStart && minutesOfDay <= rushMorningEnd) ||
    (minutesOfDay >= rushEveningStart && minutesOfDay <= rushEveningEnd)
  );
}

export function getStopCongestionLevel(waitingCount) {
  if (waitingCount >= SIM_CONFIG.severeThreshold) return 'severe';
  if (waitingCount >= SIM_CONFIG.congestionThreshold) return 'moderate';
  return 'clear';
}

export function getCongestionColor(level) {
  switch (level) {
    case 'severe':
      return '#ef4444';
    case 'moderate':
      return '#f59e0b';
    default:
      return '#22c55e';
  }
}
