import assert from 'node:assert/strict';
import { SpanStatusCode } from '@opentelemetry/api';
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

test('exported Postgres spans mask literal values in the SQL text', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-test');

  // Payload writes JSON-field query values and relation-id lists into the SQL
  // text itself; drizzle's bind parameters (`$1`) stay as they are.
  const sql =
    `select "t1"."id" from "tenants" "t1" where "t1"."domain" = $1 ` +
    `and data->>'email' like '%${SECRET}@example.com%' ` +
    `and "t1"."id" in (12, 'b1e7-${SECRET}') limit 10`;
  const span = tracer.startSpan('SELECT');
  span.setAttribute('db.system.name', 'postgresql');
  span.setAttribute('db.query.text', sql);
  span.setAttribute('db.statement', sql);
  span.end();

  const [exported] = memory.getFinishedSpans();
  for (const key of ['db.query.text', 'db.statement']) {
    const value = String(exported.attributes[key]);
    assert.ok(!value.includes(SECRET), `${key} must not carry literals`);
    assert.equal(
      value,
      `select "t1"."id" from "tenants" "t1" where "t1"."domain" = $1 ` +
        `and data->>'?' like '?' and "t1"."id" in (?) limit ?`,
    );
  }
});

test('non-Postgres statements are left to their own rules', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-test');

  const span = tracer.startSpan('get');
  span.setAttribute('db.system.name', 'redis');
  span.setAttribute('db.query.text', 'get 12');
  span.end();

  const [exported] = memory.getFinishedSpans();
  assert.equal(exported.attributes['db.query.text'], 'get 12');
});

test('exported Postgres spans mask unquoted IN-list values', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-test');

  // Payload's JSON-field `in` writes escapeSQLValue() output without quotes.
  const span = tracer.startSpan('SELECT');
  span.setAttribute('db.system.name', 'postgresql');
  span.setAttribute(
    'db.query.text',
    `select "id" from "t" where data->>'k' IN (${SECRET}@example.com,x.y) ` +
      `and "id" not in (select "id" from "u" where "a" = $1)`,
  );
  span.end();

  const [exported] = memory.getFinishedSpans();
  const value = String(exported.attributes['db.query.text']);
  assert.ok(!value.includes(SECRET));
  assert.equal(
    value,
    `select "id" from "t" where data->>'?' IN (?) and "id" not in (?)`,
  );
});

test('a failed Postgres span keeps its status code but not the error text', () => {
  const memory = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new PrivacySpanExporter(memory))],
  });
  const tracer = provider.getTracer('privacy-exporter-test');

  const pg = tracer.startSpan('SELECT');
  pg.setAttribute('db.system.name', 'postgresql');
  pg.setStatus({
    code: SpanStatusCode.ERROR,
    message: `invalid input syntax for type uuid: "${SECRET}"`,
  });
  pg.end();

  const other = tracer.startSpan('fetch');
  other.setStatus({ code: SpanStatusCode.ERROR, message: 'upstream 502' });
  other.end();

  const [pgSpan, otherSpan] = memory.getFinishedSpans();
  assert.equal(pgSpan.status.code, SpanStatusCode.ERROR);
  assert.equal(pgSpan.status.message, 'postgres error');
  assert.equal(otherSpan.status.message, 'upstream 502');
});
