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
  buildArcjetRequest,
  buildDecisionRecord,
  createArcjetProtect,
  requestFeatures,
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

const seams = { startTimer: () => () => TIMING };

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

/** The `arcjet_decision` record for a result (spec v2: timing lives there). */
function recordOf(
  result: Awaited<ReturnType<ReturnType<typeof createArcjetProtect>>>,
) {
  const { request, context } = buildArcjetRequest({
    headers: makeRequest().headers,
    path: PATH,
  });
  return buildDecisionRecord({
    result,
    enforced: false,
    route: 'search',
    tenantId: '',
    context,
    features: requestFeatures(request.headers, context),
    request,
    burst: false,
  });
}

describe('arcjet timing fields (N1)', () => {
  it('THREW path: timing and error on the result and the record, nothing to pino', async () => {
    const { log, entries } = captureLog();
    const protect = createArcjetProtect(failingClient, seams);
    const res = await protect(makeRequest(), PATH, log);
    assert.equal(res.conclusion, 'THREW');
    assert.deepEqual(res.timing, TIMING);
    assert.equal(res.errorType, 'Error');
    assert.equal(res.errorMessage, 'arcjet is down');
    assert.deepEqual(entries, []);
    const record = recordOf(res);
    assert.equal(record.duration_ms, TIMING.durationMs);
    assert.equal(record.event_loop_utilization, TIMING.eventLoopUtilization);
    assert.equal(record.conclusion, 'THREW');
  });

  it('ERROR path: timing and error type on the result and the record', async () => {
    const { log, entries } = captureLog();
    const protect = createArcjetProtect(
      { protect: async () => erroredDecision() },
      seams,
    );
    const res = await protect(makeRequest(), PATH, log);
    assert.equal(res.conclusion, 'ERROR');
    assert.deepEqual(res.timing, TIMING);
    assert.equal(res.errorType, 'ERROR');
    assert.deepEqual(entries, []);
    const record = recordOf(res);
    assert.equal(record.duration_ms, TIMING.durationMs);
    assert.equal(record.event_loop_utilization, TIMING.eventLoopUtilization);
    assert.equal(record.error_type, 'ERROR');
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
    assert.equal(res.reasonType, 'BOT');
    assert.deepEqual(entries, []);
  });
});
