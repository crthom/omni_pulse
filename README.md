# OmniPulse

An intelligent bus optimization system designed to eliminate commuter wait times. OmniPulse simulates a transit route over an accelerated weekly cycle, visualizes passenger congestion on a live map, and dynamically adjusts bus schedules based on logged demand patterns.

## Features

- **Real-time Transit Simulation**: Simulate a complete bus route with realistic passenger demand patterns across a 7-day week
- **Dynamic Schedule Optimization**: AI-powered scheduling that adapts to congestion patterns and city events
- **Live Map Visualization**: Interactive Mapbox GL JS map showing bus positions, stop congestion levels, and route geometry
- **Parallel Static Comparison**: Run a baseline static simulation alongside dynamic mode to measure improvements
- **City Event System**: Add concerts, sports games, and other events that affect traffic patterns
- **Comprehensive Metrics**: Track passenger wait times, fleet utilization, satisfaction scores, and congestion incidents
- **Daily Performance Summaries**: Automated end-of-day reports with key statistics and trend analysis
- **Speed Control**: Adjust simulation speed from 1× to 4× to fast-forward through time periods
- **Action Logging**: Real-time log of all system events, optimizations, and alerts

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo Workflow

1. **Phase 1 — Static Baseline**: Simulation starts on Standard Static Schedule. Watch Stop #4 (Lincoln Center) turn red during morning rush as wait times climb.
2. **Phase 2 — Dynamic Shift**: Toggle to **Dynamic AI Schedule**. On the next day rollover, the optimizer applies reduced headways and deploys an auxiliary bus before the Stop #4 bottleneck.
3. **Phase 3 — City Events**: Add a city event (concert, sports game) to see how the system adapts to predicted traffic surges.

Use **2×–4× speed** to fast-forward through the week.

## Technology Stack

- **React 19** — Modern React with hooks for state management
- **Vite** — Fast build tool with hot module replacement
- **Tailwind CSS** — Utility-first CSS framework for dark-mode UI
- **Mapbox GL JS** (react-map-gl) — Interactive WebGL-based mapping
- **Recharts** — Declarative charting library for metrics visualization
- **Client-side simulation** — Deterministic JavaScript simulation loop, no backend required

## Project Structure

```
omni_pulse/
├── public/
│   └── pulse.svg          # Custom SVG icon
├── src/
│   ├── components/        # React UI components
│   │   ├── ActionLog.jsx          # Real-time event logging
│   │   ├── CityMap.jsx            # Mapbox GL map with bus/stop visualization
│   │   ├── DailyOverview.jsx      # End-of-day summary modal
│   │   ├── MetricsGrid.jsx        # Key performance indicators
│   │   ├── OptimizationConsole.jsx # Main control panel
│   │   ├── ScheduleToggle.jsx     # Static/Dynamic mode switcher
│   │   └── WaitTimeChart.jsx      # Historical wait time trends
│   ├── hooks/
│   │   └── useSimulation.js       # Main simulation state management
│   ├── simulation/
│   │   ├── config.js              # Simulation constants and configuration
│   │   └── engine.js               # Core simulation logic and optimization
│   ├── App.jsx                    # Root application component
│   ├── index.css                  # Global styles
│   └── main.jsx                   # Application entry point
├── test/
│   └── deployment.test.js         # Deployment tests
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── vite.config.js                # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── postcss.config.js              # PostCSS configuration
```

## Simulation Architecture

### Core Components

**Simulation Engine** (`src/simulation/engine.js`)
- **State Management**: Maintains complete simulation state including buses, stops, passengers, and schedules
- **Passenger Spawning**: Generates passengers with time-varying rates based on rush hour patterns
- **Bus Movement**: Simulates bus travel along route segments with realistic timing
- **Congestion Detection**: Identifies bottlenecks when passenger counts exceed thresholds
- **Schedule Generation**: Creates deployment schedules for both static and dynamic modes
- **Optimization Logic**: Applies adaptive strategies based on historical congestion data
- **Parallel Simulation**: Runs a baseline static simulation for comparison metrics

**Configuration** (`src/simulation/config.js`)
- Route coordinates and stop locations (10 stops across Manhattan)
- Simulation timing parameters (tick rate, minutes per tick)
- Fleet configuration (capacity, base fleet size, maximum fleet)
- Rush hour definitions (morning, midday, evening windows)
- Congestion thresholds and alert settings
- City event types and traffic multipliers

### Schedule Modes

**Static Mode**
- Fixed deployment intervals throughout the day
- Base headway: 18 minutes during rush hours, 25 minutes off-peak
- No adaptation to current conditions
- Serves as baseline for comparison

**Dynamic Mode**
- Adaptive deployment based on previous day's congestion patterns
- Reduced headway: 8 minutes during rush hours
- Strategic auxiliary bus deployment before predicted bottlenecks
- Incorporates city event predictions
- 60% of deployments concentrated in peak windows

### City Events

The system supports various city events that affect traffic patterns:
- **Concerts**: 2.5× traffic multiplier
- **Football Games**: 2.2× traffic multiplier
- **Basketball Games**: 2.0× traffic multiplier
- **Hockey Games**: 1.9× traffic multiplier
- **Baseball Games**: 1.8× traffic multiplier
- **Marathons**: 1.5× traffic multiplier

Events are scheduled for the following day between 3 PM and 7 PM at random stops, creating predictable traffic surges that the dynamic optimizer can anticipate.

## Configuration

Key simulation parameters in `src/simulation/config.js`:

```javascript
{
  minutesPerTick: 2,              // Simulation time per tick
  tickIntervalMs: 400,            // Real-time interval between ticks
  baseHeadwayMinutes: 18,         // Static mode rush hour headway
  dynamicHeadwayMinutes: 8,        // Dynamic mode rush hour headway
  busCapacity: 20,                // Maximum passengers per bus
  baseFleetSize: 8,               // Default active buses
  maxFleetSize: 40,               // Total available buses
  congestionThreshold: 15,        // Passengers triggering moderate congestion
  severeThreshold: 30,            // Passengers triggering severe congestion
  rushMorningStart: 420,          // 7:00 AM in minutes
  rushMorningEnd: 540,            // 9:00 AM in minutes
  rushEveningStart: 1020,         // 5:00 PM in minutes
  rushEveningEnd: 1200,           // 8:00 PM in minutes
}
```

## Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm test         # Run Node.js tests
```

### Adding New Stops

Edit `src/simulation/config.js`:

```javascript
export const STOPS = [
  { id: 1, name: 'Stop Name', lng: -73.96105, lat: 40.80683 },
  // Add more stops...
];
```

### Customizing Rush Hours

Modify rush hour windows in `SIM_CONFIG`:

```javascript
rushMorningStart: 7 * 60,    // 7:00 AM
rushMorningEnd: 9 * 60,      // 9:00 AM
rushEveningStart: 17 * 60,   // 5:00 PM
rushEveningEnd: 20 * 60,     // 8:00 PM
```

### Adding City Event Types

Extend `EVENT_TYPES` in `src/simulation/engine.js`:

```javascript
const EVENT_TYPES = [
  { type: 'concert', description: 'Concert', trafficMultiplier: 2.5 },
  { type: 'festival', description: 'Street Festival', trafficMultiplier: 1.7 },
  // Add more event types...
];
```

## Metrics and Analytics

The system tracks the following key performance indicators:

- **Average Passengers Waiting**: Real-time count of passengers across all stops
- **Fleet Utilization**: Percentage of bus capacity currently in use
- **Passenger Satisfaction**: Score (5-100) based on wait times
- **Congestion Incidents**: Count of threshold-exceeding events per day
- **Deployment Count**: Number of bus deployments per day
- **Peak Wait Times**: Maximum wait time recorded at each stop

Dynamic mode includes parallel comparison with static baseline to quantify improvements.

## Deployment

### GitHub Pages (Automated)

The application uses GitHub Actions for automatic deployment to GitHub Pages. The workflow triggers on push to the `main` branch.

**Setup:**
1. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions
2. Push to `main` branch to trigger automatic deployment

The workflow will:
1. Build the production bundle
2. Deploy to GitHub Pages automatically
3. Publish to https://crthom.github.io/omni_pulse/

**Note**: The Vite config is set with `base: '/omni_pulse/'` to match the repository name for proper asset loading on GitHub Pages.

### Manual Deployment

To manually build and preview locally:

```bash
npm run build
npm run preview
```

## Testing

Run the test suite:

```bash
npm test
```

Tests are located in the `test/` directory and use Node.js's built-in test runner.

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires WebGL support for Mapbox GL JS

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
