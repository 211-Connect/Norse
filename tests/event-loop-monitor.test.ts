import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import {
  captureCpuProfile,
  type CpuProfile,
  createEventLoopMonitor,
  shortLocation,
  shouldProfile,
  summarizeProfile,
} from '../src/lib/event-loop-monitor';
import {
  drainRuntimeStats,
  MAX_NAMES,
  percentile,
  recordCount,
  recordTiming,
} from '../src/lib/runtime-stats';

/** Block the event loop, as a slow synchronous render would. */
function blockFor(ms: number) {
  const until = performance.now() + ms;
  while (performance.now() < until) {
    // busy wait
  }
}

describe('runtime stats', () => {
  test('nearest-rank percentiles', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    assert.equal(percentile(sorted, 50), 5);
    assert.equal(percentile(sorted, 95), 10);
    assert.equal(percentile([], 50), 0);
  });

  test('drain summarises and resets', () => {
    drainRuntimeStats();
    for (const ms of [10, 20, 30, 600]) recordTiming('redis', ms, ms < 500);
    recordCount('arcjet.ALLOW');
    recordCount('arcjet.ALLOW');

    const first = drainRuntimeStats();
    assert.deepEqual(first.timings.redis, {
      count: 4,
      errors: 1,
      p50Ms: 20,
      p95Ms: 600,
      maxMs: 600,
      over500Ms: 1,
    });
    assert.deepEqual(first.counts, { 'arcjet.ALLOW': 2 });
    assert.deepEqual(drainRuntimeStats(), { timings: {}, counts: {} });
  });

  test('names past the cap fold into other', () => {
    drainRuntimeStats();
    for (let i = 0; i < MAX_NAMES + 5; i++) recordTiming(`fetch:h${i}`, 1);
    const { timings } = drainRuntimeStats();
    assert.equal(Object.keys(timings).length, MAX_NAMES + 1);
    assert.equal(timings.other.count, 5);
  });
});

describe('cpu profile summary', () => {
  test('shortLocation trims the container path', () => {
    assert.equal(
      shortLocation('file:///opt/norse/app/.next/server/chunks/ssr/a.js', 0),
      '.next/server/chunks/ssr/a.js:1',
    );
    assert.equal(
      shortLocation('file:///opt/norse/app/node_modules/react-dom/x.js', 9),
      'node_modules/react-dom/x.js:10',
    );
  });

  test('self time per function, V8 buckets separate', () => {
    const node = (
      id: number,
      functionName: string,
      url: string,
      hits: number,
    ) => ({
      id,
      callFrame: { functionName, url, lineNumber: 0 },
      hitCount: hits,
    });
    const profile: CpuProfile = {
      startTime: 0,
      endTime: 1_000_000, // 1 s
      nodes: [
        node(1, '(root)', '', 0),
        node(2, '(idle)', '', 10),
        node(3, '(garbage collector)', '', 20),
        node(
          4,
          'renderToString',
          'file:///app/node_modules/react-dom/s.js',
          50,
        ),
        node(5, 'parse', 'file:///app/.next/server/x.js', 20),
      ],
    };
    const s = summarizeProfile(profile);
    assert.equal(s.samples, 100);
    assert.equal(s.idlePct, 10);
    assert.equal(s.gcPct, 20);
    assert.deepEqual(s.top[0], {
      fn: 'renderToString',
      loc: 'node_modules/react-dom/s.js:1',
      selfMs: 500,
      pct: 50,
    });
    assert.equal(s.top.length, 2);
  });

  test('a real V8 profile names the function that burned the CPU', async () => {
    function burnCpuForTheProfiler(ms: number) {
      blockFor(ms);
    }
    const capture = captureCpuProfile(300);
    await sleep(20);
    burnCpuForTheProfiler(200);
    const s = summarizeProfile(await capture);
    assert.ok(s.samples > 50, `samples ${s.samples}`);
    const names = s.top.map((t) => t.fn);
    assert.ok(
      names.includes('blockFor') || names.includes('burnCpuForTheProfiler'),
      JSON.stringify(s.top.slice(0, 5)),
    );
  });

  test('shouldProfile: thresholds and cooldown', () => {
    const busy = { utilization: 0.95, maxMs: 100 };
    const stalled = { utilization: 0.3, maxMs: 1500 };
    const calm = { utilization: 0.5, maxMs: 200 };
    assert.equal(shouldProfile(busy, 0, undefined), true);
    assert.equal(shouldProfile(stalled, 0, undefined), true);
    assert.equal(shouldProfile(calm, 0, undefined), false);
    assert.equal(shouldProfile(busy, 60_000, 0), false);
    assert.equal(shouldProfile(busy, 15 * 60_000, 0), true);
  });
});

describe('createEventLoopMonitor', () => {
  test('one event_loop line carries every health signal', async () => {
    drainRuntimeStats();
    const server = createServer((_req, res) => res.end('ok'));
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const { port } = server.address() as AddressInfo;
    const entries: Record<string, unknown>[] = [];
    const monitor = await createEventLoopMonitor((d) => entries.push(d), {
      intervalMs: 300,
      profile: false,
    });
    try {
      await (await fetch(`http://127.0.0.1:${port}/`)).text();
      recordTiming('redis', 3);
      recordCount('arcjet.ALLOW');
      await sleep(50);
      blockFor(250);
      await sleep(700); // two lines: the second has the canary result

      const loop = entries.filter((e) => e.event === 'event_loop');
      assert.ok(loop.length >= 2, `entries: ${loop.length}`);
      const blocked = loop.find((e) => (e.maxMs as number) >= 200);
      assert.ok(blocked, `no line saw the block: ${JSON.stringify(loop)}`);
      assert.ok((blocked.utilization as number) > 0.5);
      assert.ok((blocked.cpuPct as number) > 30, `cpuPct ${blocked.cpuPct}`);
      assert.equal(typeof blocked.instance, 'string');
      assert.equal(typeof blocked.uptimeS, 'number');
      const mem = blocked.memMb as Record<string, number>;
      assert.ok(mem.rss > 0 && mem.heapUsed > 0);
      assert.equal(
        typeof (blocked.gc as Record<string, number>).count,
        'number',
      );
      assert.equal(typeof blocked.handles, 'object');

      const first = loop[0];
      const timings = first.timings as Record<string, { count: number }>;
      assert.equal(
        timings[`fetch:127.0.0.1:${port}`]?.count,
        1,
        JSON.stringify(timings),
      );
      assert.equal(timings.redis.count, 1);
      assert.deepEqual(first.counts, { 'arcjet.ALLOW': 1 });
      assert.deepEqual(loop[1].counts, {}, 'stats are drained per interval');

      const canary = loop[1].canary as Record<string, unknown>;
      assert.equal(typeof canary.dnsMs, 'number', JSON.stringify(canary));
      assert.equal(typeof canary.fsMs, 'number');
    } finally {
      monitor.stop();
      server.close();
    }
  });

  test('a saturated interval triggers one cpu_profile, then cools down', async () => {
    const entries: Record<string, unknown>[] = [];
    let captures = 0;
    const stub: CpuProfile = {
      startTime: 0,
      endTime: 1000,
      nodes: [
        {
          id: 1,
          callFrame: {
            functionName: 'hot',
            url: 'file:///x.js',
            lineNumber: 0,
          },
          hitCount: 1,
        },
      ],
    };
    const monitor = await createEventLoopMonitor((d) => entries.push(d), {
      intervalMs: 200,
      captureProfile: async () => {
        captures += 1;
        return stub;
      },
      cooldownMs: 60_000,
    });
    try {
      // Over PROFILE_MAX_DELAY_MS (1 s) twice: the second is inside the
      // cooldown and must not profile again.
      await sleep(30);
      blockFor(1100);
      await sleep(250);
      blockFor(1100);
      await sleep(250);
      const profiles = entries.filter((e) => e.event === 'cpu_profile');
      assert.equal(captures, 1);
      assert.equal(profiles.length, 1);
      assert.equal((profiles[0].top as { fn: string }[])[0].fn, 'hot');
      assert.ok(profiles[0].trigger);
    } finally {
      monitor.stop();
    }
  });
});
