import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import {
  createEventLoopMonitor,
  createEventLoopProbe,
  eventLoopDelayMs,
} from '../src/lib/event-loop';

/** Block the event loop, as a slow synchronous render would. */
function blockFor(ms: number) {
  const until = performance.now() + ms;
  while (performance.now() < until) {
    // busy wait
  }
}

describe('createEventLoopProbe', () => {
  const clock = (start = 0) => {
    let t = start;
    return { now: () => t, set: (v: number) => (t = v) };
  };

  test('on-time ticks report no delay', () => {
    const c = clock();
    const probe = createEventLoopProbe(50, 1000, c.now);
    for (const at of [50, 100, 150]) {
      c.set(at);
      probe.tick();
    }
    assert.equal(probe.delayMs(160), 0);
  });

  test('a late tick reports how late it was, for the recent window', () => {
    const c = clock();
    const probe = createEventLoopProbe(50, 1000, c.now);
    c.set(50);
    probe.tick();
    c.set(800); // expected at 100: 700 ms late
    probe.tick();
    assert.equal(probe.delayMs(810), 700);
    for (let at = 850; at <= 1750; at += 50) {
      c.set(at);
      probe.tick();
    }
    assert.equal(probe.delayMs(1790), 700); // 800 is still inside the window
  });

  test('a late tick ages out of the window', () => {
    const c = clock();
    const probe = createEventLoopProbe(50, 1000, c.now);
    c.set(800);
    probe.tick(); // 750 ms late
    for (let at = 850; at <= 1850; at += 50) {
      c.set(at);
      probe.tick();
    }
    assert.equal(probe.delayMs(1850), 0);
  });

  test('a block still in progress counts before the next tick', () => {
    const c = clock();
    const probe = createEventLoopProbe(50, 1000, c.now);
    c.set(100);
    probe.tick();
    // No tick since 100: the loop has been blocked for 600 ms past due.
    assert.equal(probe.delayMs(750), 600);
  });

  test('measures a real blocked loop', async () => {
    const probe = createEventLoopProbe();
    probe.start();
    try {
      await sleep(120);
      assert.ok(probe.delayMs() < 100, `idle delay ${probe.delayMs()}`);
      blockFor(400);
      // Read right after the block, before the probe timer has run again:
      // this is what an Arcjet timeout handler would see.
      assert.ok(probe.delayMs() >= 300, `blocked delay ${probe.delayMs()}`);
    } finally {
      probe.stop();
    }
  });
});

describe('createEventLoopMonitor', () => {
  test('logs event_loop with delay percentiles and utilization', async () => {
    const entries: Record<string, unknown>[] = [];
    const monitor = await createEventLoopMonitor((d) => entries.push(d), 300);
    try {
      await sleep(50);
      blockFor(250);
      await sleep(400);
      assert.ok(entries.length >= 1, 'no event_loop entry');
      const entry = entries.find((e) => (e.maxMs as number) >= 200);
      assert.ok(entry, `no entry saw the block: ${JSON.stringify(entries)}`);
      assert.equal(entry.event, 'event_loop');
      assert.equal(entry.intervalMs, 300);
      for (const key of ['p50Ms', 'p99Ms', 'maxMs', 'utilization']) {
        assert.equal(typeof entry[key], 'number', key);
      }
      assert.ok((entry.utilization as number) > 0);
      assert.ok((entry.utilization as number) <= 1);
    } finally {
      monitor.stop();
    }
  });

  test('eventLoopDelayMs is undefined until the process-wide monitor starts', () => {
    assert.equal(eventLoopDelayMs(), undefined);
  });
});
