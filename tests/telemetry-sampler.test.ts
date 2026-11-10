import { ROOT_CONTEXT, SpanKind, TraceFlags, trace } from '@opentelemetry/api';
import { SamplingDecision } from '@opentelemetry/sdk-trace-base';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_TRACE_SAMPLE_RATIO,
  createTraceSampler,
  isHealthCheckTarget,
  traceSampleRatio,
} from '../src/lib/telemetry/sampler';

const TRACE_ID = 'f19b75958f6c9ac03bba908a167bd745';

/** What Next.js passes when it starts the request span (base-server.js). */
function sampleRequest(target: string, ratio = 1) {
  return createTraceSampler(ratio).shouldSample(
    ROOT_CONTEXT,
    TRACE_ID,
    'GET',
    SpanKind.SERVER,
    { 'http.method': 'GET', 'http.target': target },
    [],
  ).decision;
}

describe('health checks are never traced', () => {
  for (const target of [
    '/api/health',
    '/api/healthz',
    '/api/health/',
    '/api/health?probe=1',
    // MBOA serves the app under a base path.
    '/adresources/api/health/',
    '/adresources/api/healthz',
  ]) {
    it(`drops ${target}`, () => {
      assert.equal(sampleRequest(target), SamplingDecision.NOT_RECORD);
    });
  }

  for (const target of [
    '/',
    '/en/search/a04ff9ea',
    '/api/healthcheck',
    '/api/health/details',
    '/en/api/health-tips',
    '/robots.txt',
  ]) {
    it(`keeps ${target}`, () => {
      assert.equal(sampleRequest(target), SamplingDecision.RECORD_AND_SAMPLED);
    });
  }

  it('only filters server roots: a child follows its sampled parent', () => {
    const parent = trace.setSpanContext(ROOT_CONTEXT, {
      traceId: TRACE_ID,
      spanId: '2583a0531ea386f4',
      traceFlags: TraceFlags.SAMPLED,
    });
    const decision = createTraceSampler(0).shouldSample(
      parent,
      TRACE_ID,
      'fetch GET',
      SpanKind.CLIENT,
      { 'http.target': '/api/health' },
      [],
    ).decision;
    assert.equal(decision, SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('still applies the ratio to other roots', () => {
    assert.equal(sampleRequest('/en', 0), SamplingDecision.NOT_RECORD);
  });

  it('matches only strings', () => {
    assert.equal(isHealthCheckTarget(undefined), false);
    assert.equal(isHealthCheckTarget(42), false);
  });
});

describe('traceSampleRatio', () => {
  it('uses a valid value as is', () => {
    assert.deepEqual(traceSampleRatio('0.1'), { ratio: 0.1 });
    assert.deepEqual(traceSampleRatio('1'), { ratio: 1 });
    assert.deepEqual(traceSampleRatio(' 0 '), { ratio: 0 });
  });

  it('falls back to the production ratio, never to 1', () => {
    assert.equal(DEFAULT_TRACE_SAMPLE_RATIO, 0.1);
    assert.deepEqual(traceSampleRatio(undefined), {
      ratio: 0.1,
      fallbackReason: 'unset',
    });
    assert.deepEqual(traceSampleRatio(''), {
      ratio: 0.1,
      fallbackReason: 'unset',
    });
    for (const raw of ['abc', '1.5', '-0.1', 'NaN']) {
      assert.deepEqual(traceSampleRatio(raw), {
        ratio: 0.1,
        fallbackReason: 'invalid',
      });
    }
  });
});
