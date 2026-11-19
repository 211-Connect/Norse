import { strict as assert } from 'node:assert';
import { after, before, it } from 'node:test';

import { SpanStatusCode, trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

import { fetchWrapper } from '../src/app/(app)/shared/lib/fetchWrapper';

/**
 * #13: a failed `JSON.parse` left the `response.parse` span UNSET, so Tempo
 * showed a healthy span for a failed parse. The error body is untrusted
 * content and must never become a span attribute.
 */

const BODY_MARKER = 'SECRET_BODY_CONTENT';

const exporter = new InMemorySpanExporter();
const tracerProvider = new BasicTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

before(() => {
  trace.setGlobalTracerProvider(tracerProvider);
});

after(async () => {
  await tracerProvider.shutdown();
  trace.disable();
});

it('marks a failed JSON.parse on the parse span without the body', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(`<html>"${BODY_MARKER}"</html>`, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

  let result: unknown;
  try {
    result = await fetchWrapper('https://upstream.test.invalid/resource', {
      telemetry: { dependency: 'norse_api', operation: 'resource_get' },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  // The wrapper still swallows the parse failure and returns null.
  assert.equal(result, null);

  const span = exporter
    .getFinishedSpans()
    .find((candidate) => candidate.name === 'response.parse');
  assert.ok(span, 'expected the response.parse span');
  assert.equal(span.status.code, SpanStatusCode.ERROR);

  const exception = span.events.find((event) => event.name === 'exception');
  assert.ok(exception, 'expected an exception event');
  assert.equal(exception.attributes?.['exception.type'], 'SyntaxError');

  const message = String(exception.attributes?.['exception.message'] ?? '');
  assert.equal(message.includes(BODY_MARKER), false);
  assert.equal(message.includes('<'), false);

  // Nothing else on the span may carry the response body either.
  const serialized = JSON.stringify({
    attributes: span.attributes,
    events: span.events,
  });
  assert.equal(serialized.includes(BODY_MARKER), false);
});
