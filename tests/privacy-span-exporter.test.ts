import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

import { PrivacySpanExporter } from '../src/lib/privacy-span-exporter';

// Search text appears in request URLs and must never leave the process.
const SECRET = 'SECRET';
const SAFE_URL = 'https://services.c211.io/norse-api/v1/search';
const SEARCH_URL = `${SAFE_URL}?query=${SECRET}`;

test('exported spans carry no query string in the name or URL attributes', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-test');

  const span = tracer.startSpan(`GET /search?query=${SECRET}`);
  span.setAttribute('http.target', `/search?query=${SECRET}`);
  span.setAttribute('http.url', `${SEARCH_URL}#fragment`);
  span.setAttribute('url.full', SEARCH_URL);
  span.setAttribute('url.query', `query=${SECRET}`);
  span.setAttribute('next.url', `/search?query=${SECRET}`);
  span.setAttribute('http.route', '/search');
  span.end();

  const [exported] = memory.getFinishedSpans();
  assert.ok(exported, 'the span reached the delegate exporter');

  assert.equal(exported.name, 'GET /search');
  assert.equal(exported.attributes['http.target'], '/search');
  assert.equal(exported.attributes['http.url'], SAFE_URL);
  assert.equal(exported.attributes['url.full'], SAFE_URL);
  assert.equal(exported.attributes['url.query'], undefined);
  assert.equal(exported.attributes['next.url'], '/search');
  // Not URL-valued: left alone.
  assert.equal(exported.attributes['http.route'], '/search');

  for (const value of Object.values(exported.attributes)) {
    assert.ok(!String(value).includes(SECRET), `attribute leaked: ${value}`);
    assert.ok(!String(value).includes('?'), `attribute kept a query: ${value}`);
  }
});
