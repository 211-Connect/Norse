import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  ArcjetAllowDecision,
  ArcjetBotReason,
  ArcjetErrorDecision,
  ArcjetErrorReason,
  type ArcjetDecision,
} from '@arcjet/next';
import { NextRequest } from 'next/server';

import {
  type ArcjetLog,
  type ArcjetTiming,
  createArcjetProtect,
} from '../src/lib/arcjet';

type LogEntry = { level: string; event: string; data: Record<string, unknown> };

function captureLog(): { log: ArcjetLog; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return {
    entries,
    log: (level, event, data) => entries.push({ level, event, data }),
  };
}

const PATH = '/en/search';

function makeRequest() {
  return new NextRequest(`https://example.org${PATH}`, {
    headers: { host: 'example.org', 'x-forwarded-for': '8.8.8.8' },
  });
}

const TIMING: ArcjetTiming = { durationMs: 42, eventLoopUtilization: 0.123 };
const INSTANCE = 'test-instance-1';
const TRACE = { traceId: 'abc123', traceSampled: true };

const seams = {
  startTimer: () => () => TIMING,
  instance: INSTANCE,
  traceContext: () => TRACE,
};

const failingClient = {
  protect: async () => {
    throw new Error('arcjet is down');
  },
};

const erroredDecision = () =>
  new ArcjetErrorDecision({
    ttl: 0,
    results: [],
    reason: new ArcjetErrorReason('DECIDE_TIMEOUT'),
  }) as unknown as ArcjetDecision;

describe('arcjet timing fields (N1)', () => {
  it('THREW path logs all five fields', () => {
    const { log, entries } = captureLog();
    const protect = createArcjetProtect(failingClient, seams);
    const result = protect(makeRequest(), PATH, log);
    return Promise.resolve(result).then((res) => {
      assert.equal(res.conclusion, 'THREW');
      assert.deepEqual(res.timing, TIMING);
      const entry = entries.find(
        (e) => e.event === 'arcjet_fingerprint_failed',
      );
      assert.ok(entry);
      assert.equal(entry.data.durationMs, TIMING.durationMs);
      assert.equal(
        entry.data.eventLoopUtilization,
        TIMING.eventLoopUtilization,
      );
      assert.equal(entry.data.instance, INSTANCE);
      assert.equal(entry.data.traceId, TRACE.traceId);
      assert.equal(entry.data.traceSampled, TRACE.traceSampled);
    });
  });

  it('ERROR path logs all five fields', async () => {
    const { log, entries } = captureLog();
    const protect = createArcjetProtect(
      { protect: async () => erroredDecision() },
      seams,
    );
    const res = await protect(makeRequest(), PATH, log);
    assert.equal(res.conclusion, 'ERROR');
    assert.deepEqual(res.timing, TIMING);
    const entry = entries.find((e) => e.event === 'arcjet_fingerprint_failed');
    assert.ok(entry);
    assert.equal(entry.data.durationMs, TIMING.durationMs);
    assert.equal(entry.data.eventLoopUtilization, TIMING.eventLoopUtilization);
    assert.equal(entry.data.instance, INSTANCE);
    assert.equal(entry.data.traceId, TRACE.traceId);
    assert.equal(entry.data.traceSampled, TRACE.traceSampled);
  });

  it('sampled-out path carries the same fields', async () => {
    const { log, entries } = captureLog();
    const protect = createArcjetProtect(failingClient, {
      ...seams,
      sampleHeaderLog: () => false,
    });
    const res = await protect(makeRequest(), PATH, log);
    assert.equal(res.conclusion, 'THREW');
    const entry = entries.find(
      (e) => e.event === 'arcjet_fingerprint_failed_sampled_out',
    );
    assert.ok(entry);
    assert.equal(entry.data.durationMs, TIMING.durationMs);
    assert.equal(entry.data.eventLoopUtilization, TIMING.eventLoopUtilization);
    assert.equal(entry.data.instance, INSTANCE);
    assert.equal(entry.data.traceId, TRACE.traceId);
    assert.equal(entry.data.traceSampled, TRACE.traceSampled);
  });

  it('ALLOW path logs nothing and carries timing', async () => {
    const { log, entries } = captureLog();
    const protect = createArcjetProtect(
      {
        protect: async () =>
          new ArcjetAllowDecision({
            ttl: 0,
            results: [],
            reason: new ArcjetBotReason({
              allowed: ['GOOGLE_CRAWLER'],
              denied: [],
              verified: true,
              spoofed: false,
            }),
          }),
      },
      seams,
    );
    const res = await protect(makeRequest(), PATH, log);
    assert.equal(res.conclusion, 'ALLOW');
    assert.deepEqual(res.timing, TIMING);
    assert.deepEqual(entries, []);
  });
});
