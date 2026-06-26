import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createFleet, runOptimizationTick, generateDeploymentSchedule, createInitialState, onDayTransition } from '../src/simulation/engine.js';
import { SIM_CONFIG, STOPS } from '../src/simulation/config.js';

describe('Bus Deployment Logic', () => {
  it('should create fleet with unique bus IDs', () => {
    const fleet = createFleet(3, 5, 1);
    const ids = fleet.map(b => b.id);
    assert.strictEqual(fleet.length, 5);
    assert.deepStrictEqual(ids, [1, 2, 3, 4, 5]);
  });

  it('should have no duplicate IDs in fleet', () => {
    const fleet = createFleet(3, 10, 1);
    const uniqueIds = new Set(fleet.map(b => b.id));
    assert.strictEqual(uniqueIds.size, fleet.length);
  });

  it('should deploy exactly one bus per schedule entry', () => {
    const schedule = [
      { simMinutes: 420, deployed: false, isAuxiliary: false },
      { simMinutes: 480, deployed: false, isAuxiliary: false },
      { simMinutes: 540, deployed: false, isAuxiliary: false },
    ];

    const state = {
      simMinutes: 420,
      deploymentSchedule: schedule,
      buses: createFleet(0, 5, 1),
      deploymentsToday: 0,
      logs: [],
    };

    let currentState = state;
    currentState = runOptimizationTick(currentState);
    
    const activeBuses = currentState.buses.filter(b => b.active);
    assert.strictEqual(activeBuses.length, 1, 'Should deploy exactly 1 bus at minute 420');
    assert.strictEqual(currentState.deploymentSchedule[0].deployed, true);
    assert.strictEqual(currentState.deploymentSchedule[1].deployed, false);
  });

  it('should not deploy multiple buses at same timestamp', () => {
    const schedule = [
      { simMinutes: 420, deployed: false, isAuxiliary: false },
      { simMinutes: 420, deployed: false, isAuxiliary: false }, // Duplicate timestamp
    ];

    const state = {
      simMinutes: 420,
      deploymentSchedule: schedule,
      buses: createFleet(0, 5, 1),
      deploymentsToday: 0,
      logs: [],
    };

    const currentState = runOptimizationTick(state);
    const activeBuses = currentState.buses.filter(b => b.active);
    
    assert.strictEqual(activeBuses.length, 1, 'Should only deploy 1 bus even with duplicate schedule entries');
  });

  it('should increment deploymentsToday correctly', () => {
    const schedule = [
      { simMinutes: 420, deployed: false, isAuxiliary: false },
    ];

    const state = {
      simMinutes: 420,
      deploymentSchedule: schedule,
      buses: createFleet(0, 5, 1),
      deploymentsToday: 0,
      logs: [],
    };

    const currentState = runOptimizationTick(state);
    assert.strictEqual(currentState.deploymentsToday, 1);
  });

  it('should not deploy when no inactive buses available', () => {
    const schedule = [
      { simMinutes: 420, deployed: false, isAuxiliary: false },
    ];

    const state = {
      simMinutes: 420,
      deploymentSchedule: schedule,
      buses: createFleet(5, 5, 1), // All buses already active
      deploymentsToday: 0,
      logs: [],
    };

    // Mark all buses as active
    state.buses.forEach(b => b.active = true);

    const currentState = runOptimizationTick(state);
    const activeBuses = currentState.buses.filter(b => b.active);
    
    assert.strictEqual(activeBuses.length, 5, 'No new bus should be deployed');
    assert.strictEqual(currentState.deploymentsToday, 0, 'deploymentsToday should not increment');
  });

  it('should generate schedule with unique timestamps', () => {
    const schedule = generateDeploymentSchedule(420, 'static', []);
    const timestamps = schedule.map(s => s.simMinutes);
    const uniqueTimestamps = new Set(timestamps);
    
    assert.strictEqual(uniqueTimestamps.size, timestamps.length, 'Schedule should have unique timestamps');
  });

  it('should not create duplicate bus objects in initial state', () => {
    const state = createInitialState();
    const busIds = state.buses.map(b => b.id);
    const uniqueIds = new Set(busIds);
    
    assert.strictEqual(uniqueIds.size, state.buses.length, 'Initial fleet should have unique bus IDs');
  });

  it('should not deploy duplicate buses across multiple ticks', () => {
    const schedule = [
      { simMinutes: 420, deployed: false, isAuxiliary: false },
      { simMinutes: 480, deployed: false, isAuxiliary: false },
    ];

    const state = {
      simMinutes: 410,
      deploymentSchedule: schedule,
      buses: createFleet(0, 5, 1),
      deploymentsToday: 0,
      logs: [],
    };

    // Tick 1: at minute 412, nothing should deploy
    let currentState = { ...state, simMinutes: 412 };
    currentState = runOptimizationTick(currentState);
    assert.strictEqual(currentState.buses.filter(b => b.active).length, 0);

    // Tick 2: at minute 420, first bus should deploy
    currentState = { ...currentState, simMinutes: 420 };
    currentState = runOptimizationTick(currentState);
    assert.strictEqual(currentState.buses.filter(b => b.active).length, 1);

    // Tick 3: at minute 422, still only 1 bus
    currentState = { ...currentState, simMinutes: 422 };
    currentState = runOptimizationTick(currentState);
    assert.strictEqual(currentState.buses.filter(b => b.active).length, 1);

    // Tick 4: at minute 480, second bus should deploy
    currentState = { ...currentState, simMinutes: 480 };
    currentState = runOptimizationTick(currentState);
    assert.strictEqual(currentState.buses.filter(b => b.active).length, 2);
  });

  it('should deactivate all buses on day transition', () => {
    const state = {
      simMinutes: 1439, // End of day
      deploymentSchedule: [],
      buses: createFleet(3, 5, 1),
      deploymentsToday: 5,
      logs: [],
      dayCount: 0,
      scheduleMode: 'static',
      pendingScheduleMode: null,
      congestionEvents: [],
      dailySummaries: [],
      stops: STOPS.map(s => ({ ...s, waiting: [], totalBoarded: 0, peakWait: 0 })),
    };

    // Activate some buses
    state.buses[0].active = true;
    state.buses[1].active = true;
    state.buses[2].active = true;

    const nextState = onDayTransition(state, 1);
    
    assert.strictEqual(nextState.buses.filter(b => b.active).length, 0, 'All buses should be deactivated');
    assert.strictEqual(nextState.deploymentsToday, 0, 'deploymentsToday should reset');
  });

  it('should not have duplicate bus IDs after multiple deployments', () => {
    const schedule = [
      { simMinutes: 420, deployed: false, isAuxiliary: false },
      { simMinutes: 440, deployed: false, isAuxiliary: false },
      { simMinutes: 460, deployed: false, isAuxiliary: false },
    ];

    const state = {
      simMinutes: 420,
      deploymentSchedule: schedule,
      buses: createFleet(0, 5, 1),
      deploymentsToday: 0,
      logs: [],
    };

    let currentState = state;
    currentState = runOptimizationTick(currentState);
    currentState = { ...currentState, simMinutes: 440 };
    currentState = runOptimizationTick(currentState);
    currentState = { ...currentState, simMinutes: 460 };
    currentState = runOptimizationTick(currentState);

    const busIds = currentState.buses.map(b => b.id);
    const uniqueIds = new Set(busIds);
    
    assert.strictEqual(uniqueIds.size, busIds.length, 'No duplicate bus IDs should exist after deployments');
  });
});
