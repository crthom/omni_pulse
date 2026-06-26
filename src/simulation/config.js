export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const STOPS = [
  { id: 1, name: 'Central Station', lng: -122.425, lat: 37.762 },
  { id: 2, name: 'Market & 5th', lng: -122.415, lat: 37.774 },
  { id: 3, name: 'Union Square', lng: -122.408, lat: 37.789 },
  { id: 4, name: 'Chinatown Gate', lng: -122.401, lat: 37.795 },
  { id: 5, name: 'North Beach', lng: -122.411, lat: 37.805 },
  { id: 6, name: 'Fishermans Wharf', lng: -122.423, lat: 37.809 },
  { id: 7, name: 'Marina District', lng: -122.447, lat: 37.806 },
  { id: 8, name: 'Presidio Gate', lng: -122.436, lat: 37.797 },
];

export const ROUTE_COORDINATES = STOPS.map((s) => [s.lng, s.lat]);

export const SIM_CONFIG = {
  minutesPerTick: 2,
  tickIntervalMs: 400,
  baseHeadwayMinutes: 18,
  dynamicHeadwayMinutes: 8,
  offPeakHeadwayMinutes: 25,
  staticSegmentMinutes: 14,
  dynamicSegmentMinutes: 6,
  offPeakSegmentMinutes: 18,
  busCapacity: 45,
  baseFleetSize: 4,
  maxFleetSize: 5,
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
