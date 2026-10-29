import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createCircuitBreaker } from '../src/utilities/circuitBreaker';

function setup(failureThreshold = 3, openMs = 1_000) {
  let now = 1_000_000;
  const breaker = createCircuitBreaker({
    failureThreshold,
    openMs,
    now: () => now,
  });
  return {
    breaker,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('createCircuitBreaker', () => {
  test('stays closed below the threshold', () => {
    const { breaker } = setup(3);
    assert.equal(breaker.recordFailure(), null);
    assert.equal(breaker.recordFailure(), null);
    assert.equal(breaker.state, 'closed');
    assert.equal(breaker.allow(), true);
  });

  test('a success resets the consecutive failure count', () => {
    const { breaker } = setup(3);
    breaker.recordFailure();
    breaker.recordFailure();
    assert.equal(breaker.recordSuccess(), null);
    breaker.recordFailure();
    breaker.recordFailure();
    assert.equal(breaker.state, 'closed');
  });

  test('opens at the threshold and skips calls while open', () => {
    const { breaker, advance } = setup(3, 1_000);
    breaker.recordFailure();
    breaker.recordFailure();
    assert.equal(breaker.recordFailure(), 'opened');
    assert.equal(breaker.state, 'open');
    assert.equal(breaker.allow(), false);
    advance(999);
    assert.equal(breaker.allow(), false);
  });

  test('lets exactly one probe through after openMs', () => {
    const { breaker, advance } = setup(1, 1_000);
    breaker.recordFailure();
    advance(1_000);
    assert.equal(breaker.allow(), true);
    assert.equal(breaker.state, 'half-open');
    assert.equal(breaker.allow(), false);
  });

  test('a successful probe closes the circuit and reports what was skipped', () => {
    const { breaker, advance } = setup(1, 1_000);
    breaker.recordFailure();
    breaker.allow();
    breaker.allow();
    advance(1_000);
    breaker.allow(); // probe
    breaker.allow(); // skipped while the probe runs
    advance(50);
    assert.deepEqual(breaker.recordSuccess(), {
      skipped: 3,
      openForMs: 1_050,
    });
    assert.equal(breaker.state, 'closed');
    assert.equal(breaker.allow(), true);
  });

  test('a failed probe reopens for another openMs', () => {
    const { breaker, advance } = setup(1, 1_000);
    breaker.recordFailure();
    advance(1_000);
    breaker.allow();
    assert.equal(breaker.recordFailure(), 'reopened');
    assert.equal(breaker.state, 'open');
    advance(999);
    assert.equal(breaker.allow(), false);
    advance(1);
    assert.equal(breaker.allow(), true);
  });

  test('late results from before the circuit opened change nothing', () => {
    const { breaker } = setup(1, 1_000);
    breaker.recordFailure();
    assert.equal(breaker.recordFailure(), null);
    assert.equal(breaker.recordSuccess(), null);
    assert.equal(breaker.state, 'open');
  });

  test('a probe that never reports does not hold the circuit forever', () => {
    const { breaker, advance } = setup(1, 1_000);
    breaker.recordFailure();
    advance(1_000);
    assert.equal(breaker.allow(), true); // probe, never reported
    advance(999);
    assert.equal(breaker.allow(), false);
    advance(1);
    assert.equal(breaker.allow(), true);
  });
});
