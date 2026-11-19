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
function sampleRequest(
  target: string,
  { ratio = 1, basePath = '' }: { ratio?: number; basePath?: string } = {},
) {
  return createTraceSampler(ratio, basePath).shouldSample(
    ROOT_CONTEXT,
    TRACE_ID,
    'GET',
    SpanKind.SERVER,
    { 'http.method': 'GET', 'http.target': target },
    [],
  ).decision;
}

const parentContext = (traceFlags: TraceFlags) =>
  trace.setSpanContext(ROOT_CONTEXT, {
    traceId: TRACE_ID,
    spanId: '2583a0531ea386f4',
    traceFlags,
  });

describe('health checks are never traced', () => {
  for (const target of [
    '/api/health',
    '/api/healthz',
    '/api/health/',
    '/api/health?probe=1',
    '/api/health#x',
    // Absolute-form request target.
    'http://norse-app:8080/api/health',
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
    // Real catch-all routes: only the root health endpoints are dropped.
    '/en/api/health',
    '/admin/api/health',
    '/api/auth/api/health',
    '/robots.txt',
  ]) {
    it(`keeps ${target}`, () => {
      assert.equal(sampleRequest(target), SamplingDecision.RECORD_AND_SAMPLED);
    });
  }

  describe('behind a base path (MBOA)', () => {
    const basePath = '/adresources';
    for (const target of [
      '/adresources/api/health/',
      '/adresources/api/healthz',
    ]) {
      it(`drops ${target}`, () => {
        assert.equal(
          sampleRequest(target, { basePath }),
          SamplingDecision.NOT_RECORD,
        );
      });
    }

    it('keeps the health path without the base path', () => {
      assert.equal(
        sampleRequest('/api/health', { basePath }),
        SamplingDecision.RECORD_AND_SAMPLED,
      );
    });

    it('accepts a base path with a trailing slash', () => {
      assert.equal(
        sampleRequest('/adresources/api/health', { basePath: '/adresources/' }),
        SamplingDecision.NOT_RECORD,
      );
    });
  });

  it('falls back to url.path when http.target is missing', () => {
    const decision = createTraceSampler(1).shouldSample(
      ROOT_CONTEXT,
      TRACE_ID,
      'GET',
      SpanKind.SERVER,
      { 'url.path': '/api/healthz' },
      [],
    ).decision;
    assert.equal(decision, SamplingDecision.NOT_RECORD);
  });

  it('a client child follows its sampled parent', () => {
    const decision = createTraceSampler(0).shouldSample(
      parentContext(TraceFlags.SAMPLED),
      TRACE_ID,
      'fetch GET',
      SpanKind.CLIENT,
      { 'http.target': '/api/health' },
      [],
    ).decision;
    assert.equal(decision, SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('a server span with a parent (a continued CMS trace) follows it', () => {
    const decision = createTraceSampler(0).shouldSample(
      parentContext(TraceFlags.SAMPLED),
      TRACE_ID,
      'GET',
      SpanKind.SERVER,
      { 'http.target': '/api/healthz' },
      [],
    ).decision;
    assert.equal(decision, SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('treats an invalid parent as a root, like ParentBasedSampler', () => {
    const invalid = trace.setSpanContext(ROOT_CONTEXT, {
      traceId: '00000000000000000000000000000000',
      spanId: '0000000000000000',
      traceFlags: TraceFlags.SAMPLED,
    });
    const decision = createTraceSampler(1).shouldSample(
      invalid,
      TRACE_ID,
      'GET',
      SpanKind.SERVER,
      { 'http.target': '/api/health' },
      [],
    ).decision;
    assert.equal(decision, SamplingDecision.NOT_RECORD);
  });

  it('still applies the ratio to other roots', () => {
    assert.equal(
      sampleRequest('/en', { ratio: 0 }),
      SamplingDecision.NOT_RECORD,
    );
  });

  it('matches only strings', () => {
    assert.equal(isHealthCheckTarget(undefined), false);
    assert.equal(isHealthCheckTarget(42), false);
    assert.equal(isHealthCheckTarget('/api/health'), true);
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
