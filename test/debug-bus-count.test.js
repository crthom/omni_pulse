import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createInitialState, runOptimizationTick, moveBuses, spawnPassengers } from '../src/simulation/engine.js';

describe('Debug Bus Count', () => {
  it('should track active bus count accurately during simulation', () => {
    const state = createInitialState();
    
    console.log('Initial state:');
    console.log('- Total buses:', state.buses.length);
    console.log('- Active buses:', state.buses.filter(b => b.active).length);
    console.log('- Schedule entries:', state.deploymentSchedule.length);
    
    // Simulate a few ticks
    let currentState = state;
    for (let i = 0; i < 10; i++) {
      currentState = runOptimizationTick(currentState);
      const activeCount = currentState.buses.filter(b => b.active).length;
      console.log(`Tick ${i + 1}: ${activeCount} active buses`);
      
      if (activeCount > 1) {
        console.log('Active bus IDs:', currentState.buses.filter(b => b.active).map(b => b.id));
      }
    }
    
    assert.ok(true, 'Test completed - check console output');
  });

  it('should not have duplicate bus objects with same ID', () => {
    const state = createInitialState();
    
    const idCounts = {};
    state.buses.forEach(bus => {
      idCounts[bus.id] = (idCounts[bus.id] || 0) + 1;
    });
    
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    console.log('Bus ID counts:', idCounts);
    console.log('Duplicates:', duplicates);
    
    assert.strictEqual(duplicates.length, 0, 'No duplicate bus IDs should exist');
  });

  it('should not have duplicate object references in buses array', () => {
    const state = createInitialState();
    
    const objectRefs = new Set();
    const duplicates = [];
    
    state.buses.forEach((bus, index) => {
      if (objectRefs.has(bus)) {
        duplicates.push({ index, id: bus.id });
      }
      objectRefs.add(bus);
    });
    
    console.log('Duplicate object references:', duplicates);
    assert.strictEqual(duplicates.length, 0, 'No duplicate object references should exist');
  });

  it('should not create duplicate buses when moveBuses is called', () => {
    const state = createInitialState();
    
    // Manually activate a bus
    state.buses[0].active = true;
    state.buses[0].segmentIndex = 0;
    state.buses[0].progress = 0.5;
    state.buses[0].remainingSegments = 10;
    
    const initialBusCount = state.buses.length;
    const initialActiveCount = state.buses.filter(b => b.active).length;
    
    console.log('Before moveBuses:', { total: initialBusCount, active: initialActiveCount });
    
    moveBuses(state.buses, state.stops, state.simMinutes, 'static');
    
    const afterBusCount = state.buses.length;
    const afterActiveCount = state.buses.filter(b => b.active).length;
    
    console.log('After moveBuses:', { total: afterBusCount, active: afterActiveCount });
    
    assert.strictEqual(afterBusCount, initialBusCount, 'Bus count should not change');
  });
});
