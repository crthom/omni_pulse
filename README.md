# OmniPulse

An intelligent bus optimization system designed to eliminate commuter wait times. OmniPulse simulates a transit route over an accelerated weekly cycle, visualizes passenger congestion on a live map, and dynamically adjusts bus schedules based on logged demand patterns.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Mapbox (optional)

For the full Mapbox GL dark-vector map, copy `.env.example` to `.env` and add your token:

```bash
cp .env.example .env
# Edit VITE_MAPBOX_TOKEN with your key from https://account.mapbox.com/access-tokens/
```

Without a token, the app uses a built-in SVG fallback map — fully functional for demos.

## Demo Workflow

1. **Phase 1 — Static Baseline:** Simulation starts on Standard Static Schedule. Watch Stop #4 (Chinatown Gate) turn red during morning rush as wait times climb.
2. **Phase 2 — Dynamic Shift:** Toggle to **Dynamic AI Schedule**. On the next day rollover, the optimizer applies reduced headways and deploys an auxiliary bus before the Stop #4 bottleneck.

Use **2×–4× speed** to fast-forward through the week.

## Stack

- **React + Vite** — SPA with hot reload
- **Tailwind CSS** — dark-mode UI
- **Mapbox GL JS** (react-map-gl) — live route map
- **Recharts** — wait time & satisfaction trends
- **Client-side simulation** — deterministic JS loop, no backend required

## Project Structure

```
src/
├── components/       # Map, console, metrics, action log
├── hooks/            # useSimulation
└── simulation/       # Engine, config, optimizer logic
```

## License

MIT
