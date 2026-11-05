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
  span.setAttribute('resource.name', `${SEARCH_URL}#fragment`);
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
  assert.equal(exported.attributes['resource.name'], SAFE_URL);
  // Not URL-valued: left alone.
  assert.equal(exported.attributes['http.route'], '/search');

  for (const value of Object.values(exported.attributes)) {
    assert.ok(!String(value).includes(SECRET), `attribute leaked: ${value}`);
    assert.ok(!String(value).includes('?'), `attribute kept a query: ${value}`);
  }
});

test('exported span events (recordException) carry no query string', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-events-test');

  const span = tracer.startSpan('GET /search');
  span.recordException(new Error(`GET ${SEARCH_URL} failed`));
  span.end();

  const [exported] = memory.getFinishedSpans();
  assert.ok(exported, 'the span reached the delegate exporter');
  assert.equal(exported.events.length, 1);
  assert.equal(exported.events[0].name, 'exception');

  // `onRequestError` calls `recordException(err)`, so `exception.message`
  // carries the error text — URL included — into Tempo unless the exporter
  // scrubs events too (privacy rule 8).
  const serialised = JSON.stringify({
    name: exported.name,
    attributes: exported.attributes,
    events: exported.events,
  });
  assert.ok(
    !serialised.includes(SECRET),
    `event leaked the search text: ${serialised}`,
  );
  assert.ok(
    !serialised.includes('?'),
    `event kept a query string: ${serialised}`,
  );
});

test('exported spans keep the dropped-attribute count', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-dropped-test');

  const span = tracer.startSpan('too many attributes');
  for (let index = 0; index < 200; index += 1) {
    span.setAttribute(`attr.${index}`, index);
  }
  span.end();

  const [exported] = memory.getFinishedSpans();
  assert.ok(exported, 'the span reached the delegate exporter');
  assert.ok(
    exported.droppedAttributesCount > 0,
    'the sanitised span must carry the dropped-attribute count',
  );
});

// The alert webhook named in the span used to put the Discord token into Tempo
// span-metrics (`span_name`); query stripping alone cannot remove it.
test('exported spans replace a Discord webhook id and token', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-webhook-test');

  const webhookUrl = 'https://discord.com/api/webhooks/123/SECRET';
  const span = tracer.startSpan(`fetch POST ${webhookUrl}`);
  span.setAttribute('http.url', webhookUrl);
  span.setAttribute('resource.name', webhookUrl);
  span.recordException(new Error(`POST ${webhookUrl} failed`));
  span.end();

  const [exported] = memory.getFinishedSpans();
  assert.ok(exported, 'the span reached the delegate exporter');

  const placeholder = 'https://discord.com/api/webhooks/{id}/{token}';
  assert.equal(exported.name, `fetch POST ${placeholder}`);
  assert.equal(exported.attributes['http.url'], placeholder);
  assert.equal(exported.attributes['resource.name'], placeholder);

  const serialised = JSON.stringify({
    name: exported.name,
    attributes: exported.attributes,
    events: exported.events,
  });
  assert.equal(serialised.includes('SECRET'), false);
  assert.equal(serialised.includes('/api/webhooks/123'), false);
  assert.equal(serialised.includes(placeholder), true);
});
