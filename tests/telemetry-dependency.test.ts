import { strict as assert } from 'node:assert';
import { AsyncLocalStorage } from 'node:async_hooks';
import { before, describe, it } from 'node:test';

import {
  type Context,
  ROOT_CONTEXT,
  TraceFlags,
  context,
  propagation,
  trace,
} from '@opentelemetry/api';

import { InjectOnlyTraceContextPropagator } from '../src/instrumentation';
import { resolveApiRequest } from '../src/lib/telemetry/api-fetch';
import {
  classifyStatus,
  isTimeoutError,
  toOperation,
} from '../src/lib/telemetry/dependency';
import { injectTraceparent, spanOptionsFor } from '../src/lib/telemetry/fetch';

// N2 registers this propagator globally in `register()`; tests set it here so
// the `-00` injection path is exercised with the real propagator.
propagation.setGlobalPropagator(new InjectOnlyTraceContextPropagator());

before(() => {
  // The API's default context manager is a no-op; the SDK installs a real one
  // in the app. This mirrors tests/trace-context.test.ts.
  const storage = new AsyncLocalStorage<Context>();
  context.setGlobalContextManager({
    active: () => storage.getStore() ?? ROOT_CONTEXT,
    with: (ctx, fn, thisArg, ...args) =>
      storage.run(ctx, () => fn.apply(thisArg, args)),
    bind: (_ctx, target) => target,
    enable() {
      return this;
    },
    disable() {
      return this;
    },
  });
});

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba90263';

function withUnsampledSpan<T>(fn: () => T): T {
  const span = trace.wrapSpanContext({
    traceId: TRACE_ID,
    spanId: SPAN_ID,
    traceFlags: TraceFlags.NONE,
    isRemote: false,
  });
  return context.with(trace.setSpan(context.active(), span), fn);
}

describe('classifyStatus', () => {
  it('maps 2xx/3xx to ok', () => {
    assert.equal(classifyStatus('norse_api', 'search_v1', 200), 'ok');
    assert.equal(classifyStatus('norse_api', 'search_v1', 302), 'ok');
  });

  it('maps 5xx to error', () => {
    assert.equal(classifyStatus('norse_api', 'search_v1', 500), 'error');
    assert.equal(classifyStatus('redis', 'get', 503), 'error');
  });

  it('maps 4xx to error, except a 404 resource_get', () => {
    assert.equal(classifyStatus('norse_api', 'search_v1', 404), 'error');
    assert.equal(classifyStatus('keycloak', 'token', 401), 'error');
    assert.equal(classifyStatus('norse_api', 'search_v1', 429), 'error');
    assert.equal(classifyStatus('norse_api', 'resource_get', 404), 'ok');
  });

  it('does not apply the 404 rule to another dependency', () => {
    assert.equal(classifyStatus('keycloak', 'resource_get', 404), 'error');
  });
});

describe('operation mapping', () => {
  it('resolves the search operations by method', () => {
    assert.equal(resolveApiRequest('GET', '/search').operation, 'search_v1');
    assert.equal(resolveApiRequest('POST', '/search').operation, 'search_v2');
    assert.equal(
      resolveApiRequest('GET', '/search/predict').operation,
      'search_predict',
    );
    assert.equal(
      resolveApiRequest('GET', '/search/re-rank').operation,
      'search_rerank',
    );
  });

  it('resolves resources, statics before placeholders', () => {
    assert.deepEqual(resolveApiRequest('POST', '/resource/titles'), {
      operation: 'resource_titles',
      template: '/resource/titles',
    });
    assert.deepEqual(resolveApiRequest('GET', '/resource/abc123'), {
      operation: 'resource_get',
      template: '/resource/{id}',
    });
  });

  it('strips IDs into the path template', () => {
    assert.deepEqual(
      resolveApiRequest('PATCH', '/printable-directories/42/sections/7'),
      {
        operation: 'printable_directory',
        template: '/printable-directories/{id}/sections/{sectionId}',
      },
    );
  });

  it('resolves the remaining fixed operations', () => {
    const cases: [string, string, string][] = [
      ['GET', '/suggestion/term', 'suggestion'],
      ['GET', '/taxonomy', 'taxonomy'],
      ['GET', '/geocoding/forward', 'geocoding'],
      ['GET', '/organization/service-at-location/9', 'organization'],
      ['GET', '/service/9', 'service'],
      ['GET', '/favorite-list/search', 'favorite'],
      ['DELETE', '/favorite/1/2', 'favorite'],
      ['POST', '/analytics/events', 'analytics'],
      ['POST', '/cms-config/cache/clear/tenant', 'cms_config'],
    ];
    for (const [method, path, operation] of cases) {
      assert.equal(resolveApiRequest(method, path).operation, operation);
    }
  });

  it('maps unknown paths to other', () => {
    assert.deepEqual(resolveApiRequest('GET', '/health'), {
      operation: 'other',
      template: '/health',
    });
    assert.deepEqual(resolveApiRequest('GET', '/short-url/abc'), {
      operation: 'other',
      template: '/short-url/abc',
    });
  });
});

describe('toOperation', () => {
  it('keeps known operations and maps unknown ones to other', () => {
    assert.equal(toOperation('norse_api', 'search_v1'), 'search_v1');
    assert.equal(toOperation('norse_api', 'bogus'), 'other');
    assert.equal(toOperation('redis', 'incr'), 'incr');
    assert.equal(toOperation('redis', 'flushdb'), 'other');
  });
});

describe('isTimeoutError', () => {
  it('recognises timeouts and aborts', () => {
    assert.equal(isTimeoutError({ name: 'TimeoutError' }), true);
    assert.equal(isTimeoutError({ name: 'AbortError' }), true);
    assert.equal(isTimeoutError(new Error('Command timed out')), true);
  });

  it('rejects other failures', () => {
    assert.equal(isTimeoutError(new Error('boom')), false);
    assert.equal(isTimeoutError(undefined), false);
    assert.equal(isTimeoutError('Command timed out'), false);
  });
});

describe('traceparent injection', () => {
  it('adds a `-00` traceparent for an unsampled active context', () => {
    withUnsampledSpan(() => {
      const headers = new Headers();
      injectTraceparent(headers, 'norse_api');
      assert.equal(
        headers.get('traceparent'),
        `00-${TRACE_ID}-${SPAN_ID}-00`,
      );
    });
  });

  it('never overwrites an existing traceparent', () => {
    withUnsampledSpan(() => {
      const headers = new Headers({
        traceparent: `00-${TRACE_ID}-${SPAN_ID}-01`,
      });
      injectTraceparent(headers, 'norse_api');
      assert.equal(
        headers.get('traceparent'),
        `00-${TRACE_ID}-${SPAN_ID}-01`,
      );
    });
  });

  it('does not inject for other dependencies', () => {
    withUnsampledSpan(() => {
      const headers = new Headers();
      injectTraceparent(headers, 'keycloak');
      assert.equal(headers.get('traceparent'), null);
    });
  });
});

describe('fetch span privacy', () => {
  it('keeps the query string out of the span name and attributes', () => {
    const { opentelemetry } = spanOptionsFor(
      'https://services.c211.io/norse-api/v1/search?query=crisis&coords=1,2',
      'get',
    );
    assert.ok(opentelemetry);
    assert.equal(
      opentelemetry.spanName,
      'fetch GET services.c211.io/norse-api/v1/search',
    );
    assert.deepEqual(opentelemetry.attributes, {
      'http.url': 'https://services.c211.io/norse-api/v1/search',
    });
    assert.equal(JSON.stringify(opentelemetry).includes('?'), false);
  });

  it('uses the path template and still drops the query string', () => {
    const { opentelemetry } = spanOptionsFor(
      'https://services.c211.io/norse-api/v1/resource/abc?tenant=1',
      'GET',
      '/resource/{id}',
    );
    assert.ok(opentelemetry);
    assert.equal(
      opentelemetry.spanName,
      'fetch GET services.c211.io/resource/{id}',
    );
    assert.equal(JSON.stringify(opentelemetry).includes('?'), false);
  });
});
