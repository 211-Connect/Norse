import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { ROOT_CONTEXT, trace, type TextMapGetter } from '@opentelemetry/api';

import {
  InjectOnlyTraceContextPropagator,
  InternalCallerTraceContextPropagator,
  createPropagator,
  propagateContextUrls,
  serviceNameForRole,
} from '../src/instrumentation';

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba90263';
const TRACEPARENT = `00-${TRACE_ID}-${SPAN_ID}-01`;
const SECRET = 'route-secret-value';

const getter: TextMapGetter<Record<string, string | string[]>> = {
  get: (carrier, key) => carrier[key],
  keys: (carrier) => Object.keys(carrier),
};

/**
 * Since the app/CMS split, `norse-app` calls `norse-cms` over HTTP. The CMS
 * must continue the app's trace for those calls (so CMS and Postgres spans
 * sit under the app request) and still ignore every upstream `traceparent`
 * on public traffic (DO App Platform / Cloudflare → rootless traces).
 */
describe('InternalCallerTraceContextPropagator', () => {
  const propagator = new InternalCallerTraceContextPropagator(SECRET);

  it('continues the trace of an authenticated internal call', () => {
    const output = propagator.extract(
      ROOT_CONTEXT,
      { traceparent: TRACEPARENT, 'x-internal-api-key': SECRET },
      getter,
    );
    const spanContext = trace.getSpanContext(output);
    assert.equal(spanContext?.traceId, TRACE_ID);
    assert.equal(spanContext?.spanId, SPAN_ID);
    assert.equal(spanContext?.isRemote, true);
  });

  it('accepts the key when the carrier holds it as an array', () => {
    const output = propagator.extract(
      ROOT_CONTEXT,
      { traceparent: TRACEPARENT, 'x-internal-api-key': [SECRET] },
      getter,
    );
    assert.equal(trace.getSpanContext(output)?.traceId, TRACE_ID);
  });

  it('ignores traceparent on public traffic (no key)', () => {
    const output = propagator.extract(
      ROOT_CONTEXT,
      { traceparent: TRACEPARENT },
      getter,
    );
    assert.equal(output, ROOT_CONTEXT);
    assert.equal(trace.getSpanContext(output), undefined);
  });

  it('ignores traceparent when the key is wrong', () => {
    for (const key of ['', 'nope', `${SECRET}x`, SECRET.slice(1)]) {
      const output = propagator.extract(
        ROOT_CONTEXT,
        { traceparent: TRACEPARENT, 'x-internal-api-key': key },
        getter,
      );
      assert.equal(trace.getSpanContext(output), undefined, `key "${key}"`);
    }
  });

  it('never throws on a broken getter', () => {
    const throwing: TextMapGetter<unknown> = {
      get: () => {
        throw new Error('boom');
      },
      keys: () => [],
    };
    assert.equal(propagator.extract(ROOT_CONTEXT, {}, throwing), ROOT_CONTEXT);
  });
});

describe('createPropagator', () => {
  const carrier = { traceparent: TRACEPARENT, 'x-internal-api-key': SECRET };

  it('the CMS trusts authenticated internal calls', () => {
    const propagator = createPropagator({
      NORSE_ROLE: 'cms',
      PAYLOAD_API_ROUTE_SECRET: SECRET,
    });
    assert.ok(propagator instanceof InternalCallerTraceContextPropagator);
    const output = propagator.extract(ROOT_CONTEXT, carrier, getter);
    assert.equal(trace.getSpanContext(output)?.traceId, TRACE_ID);
  });

  it('the public app never extracts, even with the key', () => {
    const propagator = createPropagator({
      NORSE_ROLE: 'app',
      PAYLOAD_API_ROUTE_SECRET: SECRET,
    });
    assert.ok(!(propagator instanceof InternalCallerTraceContextPropagator));
    assert.ok(propagator instanceof InjectOnlyTraceContextPropagator);
    const output = propagator.extract(ROOT_CONTEXT, carrier, getter);
    assert.equal(trace.getSpanContext(output), undefined);
  });

  it('without a shared secret nothing is trusted', () => {
    const propagator = createPropagator({ NORSE_ROLE: 'cms' });
    const output = propagator.extract(ROOT_CONTEXT, carrier, getter);
    assert.equal(trace.getSpanContext(output), undefined);
  });

  it('an invalid role falls back to inject-only', () => {
    const propagator = createPropagator({
      NORSE_ROLE: 'bogus',
      PAYLOAD_API_ROUTE_SECRET: SECRET,
    });
    const output = propagator.extract(ROOT_CONTEXT, carrier, getter);
    assert.equal(trace.getSpanContext(output), undefined);
  });
});

describe('propagateContextUrls', () => {
  it('covers the Norse API and the CMS internal API', () => {
    assert.deepEqual(
      propagateContextUrls({
        API_URL: 'https://services.c211.io/norse-api/v1',
        PAYLOAD_CMS_URL: 'http://norse-cms:8080/',
      }),
      ['https://services.c211.io/norse-api/v1', 'http://norse-cms:8080/'],
    );
  });

  it('normalises the CMS prefix the way the outgoing URL is serialised', () => {
    // @vercel/otel compares against url.toString(): default port dropped,
    // host lowercased. A non-normalised prefix would silently never match.
    const [prefix] = propagateContextUrls({
      PAYLOAD_CMS_URL: 'http://Norse-CMS:80',
    });
    assert.equal(prefix, 'http://norse-cms/');
    const outgoing = new URL('http://norse-cms:80/api/internal/app-config');
    assert.ok(outgoing.toString().startsWith(prefix));

    const [withPath] = propagateContextUrls({
      PAYLOAD_CMS_URL: 'http://norse-cms:8080/base//',
    });
    assert.equal(withPath, 'http://norse-cms:8080/base/');
  });

  it('is empty when neither is configured', () => {
    assert.deepEqual(propagateContextUrls({}), []);
  });
});

describe('serviceNameForRole', () => {
  it('names the CMS norse-cms and everything else norse-app', () => {
    assert.equal(serviceNameForRole({ NORSE_ROLE: 'cms' }), 'norse-cms');
    assert.equal(serviceNameForRole({ NORSE_ROLE: 'app' }), 'norse-app');
    assert.equal(serviceNameForRole({ NORSE_ROLE: 'all' }), 'norse-app');
    assert.equal(serviceNameForRole({}), 'norse-app');
    assert.equal(serviceNameForRole({ NORSE_BUILD: 'cms' }), 'norse-cms');
    assert.equal(serviceNameForRole({ NORSE_ROLE: 'bogus' }), 'norse-app');
  });
});
