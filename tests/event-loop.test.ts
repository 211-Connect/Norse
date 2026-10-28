import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  eventLoopSample,
  eventLoopUtilizationSince,
} from '../src/lib/event-loop';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const block = (ms: number) => {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // busy
  }
};

describe('event-loop utilization over one call (ISS-1739)', () => {
  test('an awaited call during which the loop is blocked reads near 1', async () => {
    const sample = eventLoopSample();
    // What a timed-out Arcjet call looks like when our process is the
    // cause: the loop is busy for most of the wait.
    const call = sleep(200);
    setTimeout(() => block(150), 5);
    await call;
    const utilization = eventLoopUtilizationSince(sample);
    assert.ok(utilization !== undefined);
    assert.ok(utilization > 0.6, `utilization ${utilization}`);
  });

  test('an awaited call on an idle loop reads near 0', async () => {
    const sample = eventLoopSample();
    await sleep(200);
    const utilization = eventLoopUtilizationSince(sample);
    assert.ok(utilization !== undefined);
    assert.ok(utilization < 0.2, `utilization ${utilization}`);
  });

  test('no sample reads undefined', () => {
    assert.equal(eventLoopUtilizationSince(undefined), undefined);
  });
});
