import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createInitialState, runOptimizationTick, generateDeploymentSchedule } from '../src/simulation/engine.js';

describe('Deployment Count Investigation', () => {
  it('should have exactly 50 schedule entries per day', () => {
    const state = createInitialState();
    console.log('Schedule entries:', state.deploymentSchedule.length);
    assert.strictEqual(state.deploymentSchedule.length, 50, 'Should have 50 schedule entries');
  });

  it('should deploy exactly 50 buses in a full day simulation', () => {
    const state = createInitialState();
    let currentState = state;
    let totalDeployments = 0;

    console.log('Initial simMinutes:', state.simMinutes);
    console.log('Schedule first 5 entries:', state.deploymentSchedule.slice(0, 5));
    console.log('Schedule last 5 entries:', state.deploymentSchedule.slice(-5));

    // Simulate a full day (1440 minutes) - need to start from schedule start
    for (let minute = state.simMinutes; minute < state.simMinutes + 1440; minute += 2) {
      const beforeDeployments = currentState.deploymentsToday;
      currentState = runOptimizationTick(currentState);
      currentState.simMinutes = minute;
      const afterDeployments = currentState.deploymentsToday;
      
      if (afterDeployments > beforeDeployments) {
        totalDeployments++;
      }
    }

    console.log('Total deployments in day:', totalDeployments);
    console.log('Final deploymentsToday:', currentState.deploymentsToday);
    console.log('Remaining undeployed schedule entries:', currentState.deploymentSchedule.filter(s => !s.deployed).length);
    assert.strictEqual(totalDeployments, 50, 'Should deploy exactly 50 buses');
  });

  it('should not have duplicate timestamps in schedule', () => {
    const state = createInitialState();
    const timestamps = state.deploymentSchedule.map(s => s.simMinutes);
    const uniqueTimestamps = new Set(timestamps);
    
    console.log('Schedule timestamps:', timestamps.length);
    console.log('Unique timestamps:', uniqueTimestamps.size);
    
    assert.strictEqual(uniqueTimestamps.size, timestamps.length, 'Schedule should have unique timestamps');
  });

  it('should not regenerate schedule with duplicates on day transition', () => {
    const state = createInitialState();
    
    // Simulate day transition
    const nextState = state;
    const afterTransition = { ...nextState, simMinutes: 1440 }; // End of day
    
    console.log('Before transition - schedule length:', state.deploymentSchedule.length);
    console.log('Before transition - unique timestamps:', new Set(state.deploymentSchedule.map(s => s.simMinutes)).size);
    
    // This would normally call onDayTransition, but let's just check the schedule generation
    const newSchedule = generateDeploymentSchedule(1440, 'static', []);
    
    console.log('After transition - schedule length:', newSchedule.length);
    console.log('After transition - unique timestamps:', new Set(newSchedule.map(s => s.simMinutes)).size);
    
    assert.strictEqual(newSchedule.length, 50, 'New schedule should have 50 entries');
    assert.strictEqual(new Set(newSchedule.map(s => s.simMinutes)).size, 50, 'New schedule should have unique timestamps');
  });
});
