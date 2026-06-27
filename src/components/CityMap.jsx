import { useMemo, useCallback } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { ROUTE_COORDINATES, STOPS } from '../simulation/config';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function interpolatePosition(bus, stops) {
  const from = stops[bus.segmentIndex];
  const to = stops[(bus.segmentIndex + 1) % stops.length];
  if (!from || !to) return { lng: STOPS[0].lng, lat: STOPS[0].lat };

  return {
    lng: from.lng + (to.lng - from.lng) * bus.progress,
    lat: from.lat + (to.lat - from.lat) * bus.progress,
  };
}

function getBusPositionOffset(busId) {
  const angle = ((busId * 137.5) % 360) * (Math.PI / 180);
  const distance = 0.00008 + ((busId % 4) * 0.00002);
  return {
    lng: Math.cos(angle) * distance,
    lat: Math.sin(angle) * distance,
  };
}

function StopMarker({ stop, level, waitingCount }) {
  const colors = {
    clear: '#22c55e',
    moderate: '#f59e0b',
    severe: '#ef4444',
  };
  const color = colors[level] || colors.clear;
  const size = level === 'severe' ? 28 : level === 'moderate' ? 22 : 18;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`rounded-full border-2 border-white/20 flex items-center justify-center font-mono text-[10px] font-bold text-white ${
          level === 'severe' ? 'animate-pulse-red' : ''
        }`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 0 ${level === 'severe' ? 16 : 8}px ${color}`,
        }}
      >
        {stop.id}
      </div>
      {waitingCount > 0 && (
        <span className="mt-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white/80">
          {waitingCount} waiting
        </span>
      )}
    </div>
  );
}

function FallbackMap({ stopsWithLevel, buses, formatted }) {
  const width = 900;
  const height = 650;
  const padding = 90;

  const points = useMemo(() => {
    const lngs = STOPS.map((s) => s.lng);
    const lats = STOPS.map((s) => s.lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const project = (lng, lat) => ({
      x: padding + ((lng - minLng) / (maxLng - minLng || 1)) * (width - padding * 2),
      y: height - padding - ((lat - minLat) / (maxLat - minLat || 1)) * (height - padding * 2),
    });

    return { project };
  }, []);

  const routePath = STOPS.map((s, i) => {
    const p = points.project(s.lng, s.lat);
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ') + ` L ${points.project(STOPS[0].lng, STOPS[0].lat).x} ${points.project(STOPS[0].lng, STOPS[0].lat).y}`;

  return (
    <div className="relative h-full w-full bg-pulse-bg">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>

        <path
          d={routePath}
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
        />

        {stopsWithLevel.map((stop, idx) => {
          const p = points.project(stop.lng, stop.lat);
          const colors = { clear: '#22c55e', moderate: '#f59e0b', severe: '#ef4444' };
          const r = stop.congestionLevel === 'severe' ? 14 : 10;
          const labelAbove = idx % 2 === 0;
          const labelY = labelAbove ? p.y - r - 14 : p.y + r + 22;
          const countY = labelAbove ? p.y + r + 16 : p.y - r - 6;

          return (
            <g key={stop.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={r + 4}
                fill={colors[stop.congestionLevel]}
                opacity="0.3"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={colors[stop.congestionLevel]}
                stroke="#fff"
                strokeWidth="1.5"
              />
              <text
                x={p.x}
                y={labelY}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="500"
              >
                #{stop.id} {stop.name}
              </text>
              {stop.waitingCount > 0 && (
                <text
                  x={p.x}
                  y={countY}
                  textAnchor="middle"
                  fill="#f59e0b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {stop.waitingCount} waiting
                </text>
              )}
            </g>
          );
        })}

        {buses.filter((bus) => bus.active).map((bus) => {
          const pos = interpolatePosition(
            bus,
            STOPS.map((s) => ({ lng: s.lng, lat: s.lat }))
          );
          const offset = getBusPositionOffset(bus.id);
          const renderPos = points.project(pos.lng + offset.lng, pos.lat + offset.lat);
          return (
            <g key={bus.id}>
              <circle cx={renderPos.x} cy={renderPos.y} r="12" fill="#00f0ff" opacity="0.25" />
              <circle
                cx={renderPos.x}
                cy={renderPos.y}
                r="6"
                fill={bus.isAuxiliary ? '#a855f7' : '#00f0ff'}
                stroke="#fff"
                strokeWidth="1"
              />
              <text
                x={renderPos.x}
                y={renderPos.y - 14}
                textAnchor="middle"
                fill="#00f0ff"
                fontSize="9"
                fontFamily="monospace"
              >
                {bus.label}
              </text>
              <text
                x={renderPos.x}
                y={renderPos.y + 18}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="7"
                fontFamily="monospace"
                opacity="0.7"
              >
                ID:{bus.id}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute left-4 top-4 rounded-lg border border-pulse-border bg-pulse-panel/90 px-4 py-2 backdrop-blur">
        <p className="font-mono text-xs text-slate-400">LIVE SIMULATION</p>
        <p className="text-lg font-semibold text-white">
          {formatted.day} · {formatted.time}
        </p>
      </div>
      <div className="absolute bottom-3 left-3 rounded bg-black/60 px-3 py-1.5 text-xs text-slate-400">
        SVG fallback — set VITE_MAPBOX_TOKEN for Mapbox GL
      </div>
    </div>
  );
}

export default function CityMap({ stopsWithLevel, buses, formatted }) {
  const routeGeoJSON = useMemo(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: ROUTE_COORDINATES,
      },
    }),
    []
  );

  const busPositions = useMemo(() => {
    const activeBuses = buses.filter((bus) => bus.active);
    const positions = activeBuses.map((bus) => {
      const pos = interpolatePosition(bus, stopsWithLevel);
      const offset = getBusPositionOffset(bus.id);
      return {
        bus,
        longitude: pos.lng + offset.lng,
        latitude: pos.lat + offset.lat,
      };
    });
    
    // Debug: log if we have duplicate bus IDs
    const ids = activeBuses.map(b => b.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      console.error('Duplicate bus IDs in active buses:', ids);
    }
    
    return positions;
  }, [buses, stopsWithLevel]);

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_token_here') {
    return <FallbackMap stopsWithLevel={stopsWithLevel} buses={buses} formatted={formatted} />;
  }

  return (
    <div className="relative h-full w-full">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: -73.96564,
          latitude: 40.78241,
          zoom: 12.25,
          pitch: 45,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': '#6366f1',
              'line-width': 4,
              'line-opacity': 0.7,
            }}
          />
        </Source>

        {stopsWithLevel.map((stop) => (
          <Marker key={stop.id} longitude={stop.lng} latitude={stop.lat} anchor="center">
            <StopMarker
              stop={stop}
              level={stop.congestionLevel}
              waitingCount={stop.waitingCount}
            />
          </Marker>
        ))}

        {busPositions.map(({ bus, longitude, latitude }) => (
          <Marker
            key={bus.id}
            longitude={longitude}
            latitude={latitude}
            anchor="center"
            transitionDuration={0}
          >
            <div
              className="relative flex flex-col items-center"
            >
              <div
                className={`rounded-full ${bus.isAuxiliary ? 'bg-purple-500' : 'bg-pulse-neon'} animate-glow`}
                style={{
                  width: 14,
                  height: 14,
                  boxShadow: `0 0 12px ${bus.isAuxiliary ? '#a855f7' : '#00f0ff'}`,
                }}
                title={bus.label}
              />
              <span className="mt-1 text-[8px] text-white/70 font-mono">ID:{bus.id}</span>
            </div>
          </Marker>
        ))}
      </Map>

      <div className="absolute left-4 top-4 rounded-lg border border-pulse-border bg-pulse-panel/90 px-4 py-2 backdrop-blur">
        <p className="font-mono text-xs text-slate-400">LIVE SIMULATION</p>
        <p className="text-lg font-semibold text-white">
          {formatted.day} · {formatted.time}
        </p>
      </div>
    </div>
  );
}
