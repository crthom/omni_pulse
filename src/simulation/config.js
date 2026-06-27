export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const STOPS = [
  { id: 1, name: 'Columbia University', lng: -73.96105, lat: 40.80683 },
  { id: 2, name: "St. Michael's Church", lng: -73.96873, lat: 40.79629 },
  { id: 3, name: "Children's Museum", lng: -73.97656, lat: 40.78557 },
  { id: 4, name: 'Lincoln Center', lng: -73.98556, lat: 40.77321 },
  { id: 5, name: 'New York Public Library', lng: -73.99134, lat: 40.76531 },
  { id: 6, name: "Turtle's Bay", lng: -73.97029, lat: 40.75647 },
  { id: 7, name: 'Upper East Side', lng: -73.96061, lat: 40.76975 },
  { id: 8, name: 'Central Park', lng: -73.95465, lat: 40.77790 },
  { id: 9, name: '23rd Precinct', lng: -73.94669, lat: 40.78881 },
  { id: 10, name: 'East Harlem', lng: -73.94002, lat: 40.79796 },
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
  maxFleetSize: 40,
  deploymentLimitPerDay: 40,
  rushMorningStart: 7 * 60,
  rushMorningEnd: 9 * 60,
  middayRushStart: 12 * 60,
  middayRushEnd: 13 * 60,
  rushEveningStart: 17 * 60,
  rushEveningEnd: 20 * 60,
  congestionThreshold: 15,
  severeThreshold: 30,
  dailyVariationMinutes: 10,
  alertCooldownMinutes: 45,
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
