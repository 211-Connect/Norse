import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { ArcjetLog } from '../src/lib/arcjet';
import {
  BLOCKED_TRAFFIC_EVENT_NAME,
  BLOCKED_TRAFFIC_MAX_BATCH,
  buildBlockedTrafficEvent,
  createBlockedTrafficSender,
  resolveBlockedTrafficTarget,
  type BlockedTrafficEventData,
  type BlockedTrafficTarget,
} from '../src/lib/blocked-traffic-events';

type LogEntry = { level: string; event: string; data: Record<string, unknown> };

function captureLog(): { log: ArcjetLog; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return {
    entries,
    log: (level, event, data) => entries.push({ level, event, data }),
  };
}

type Call = { url: string; init: RequestInit; body: { events: unknown[] } };

function fakeFetch(
  respond: (call: Call) => Response | Promise<Response> = () =>
    new Response('{}', { status: 200 }),
) {
  const calls: Call[] = [];
  const fetchImpl = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const call: Call = {
      url: String(input),
      init: init ?? {},
      body: JSON.parse(String(init?.body)),
    };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
  return { calls, fetch: fetchImpl };
}

const TENANT_A: BlockedTrafficTarget = {
  tenantId: 'tenant-a',
  analyticsApiKey: 'key-a',
  websiteId: '11111111-1111-4111-8111-111111111111',
};
const TENANT_B: BlockedTrafficTarget = {
  tenantId: 'tenant-b',
  analyticsApiKey: 'key-b',
  websiteId: '22222222-2222-4222-8222-222222222222',
};

const DATA: BlockedTrafficEventData = {
  classification: 'nefarious',
  bot: 'CURL',
  category: 'CATEGORY:TOOL',
  reason: 'bot',
  source: 'proxy',
  enforced: true,
  host: 'example.org',
  path: '/en/search?q=food',
};

const event = (websiteId = TENANT_A.websiteId) =>
  buildBlockedTrafficEvent(websiteId, DATA, new Date('2026-10-16T12:00:00Z'));

describe('buildBlockedTrafficEvent (ISS-2366)', () => {
  test('matches Norse-API SendEventDto: websiteId + payload{name,data,timestamp}', () => {
    const built = event();
    assert.deepEqual(built, {
      websiteId: TENANT_A.websiteId,
      payload: {
        name: 'bot_blocked',
        data: {
          classification: 'nefarious',
          bot: 'CURL',
          category: 'CATEGORY:TOOL',
          reason: 'bot',
          source: 'proxy',
          enforced: true,
          host: 'example.org',
          path: '/en/search?q=food',
        },
        timestamp: '2026-10-16T12:00:00.000Z',
      },
    });
    assert.equal(BLOCKED_TRAFFIC_EVENT_NAME, 'bot_blocked');
    // Only the keys the DTO declares; nothing extra leaks onto the wire.
    assert.deepEqual(Object.keys(built).sort(), ['payload', 'websiteId']);
    assert.deepEqual(Object.keys(built.payload).sort(), [
      'data',
      'name',
      'timestamp',
    ]);
    // Strict ISO-8601 (what `@IsISO8601({ strict: true })` accepts).
    assert.match(
      built.payload.timestamp,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  test('observe-only denial carries enforced:false', () => {
    const built = buildBlockedTrafficEvent(TENANT_A.websiteId, {
      ...DATA,
      enforced: false,
    });
    assert.equal((built.payload.data as { enforced: boolean }).enforced, false);
  });
});

describe('resolveBlockedTrafficTarget (ISS-2366)', () => {
  const tenant = {
    tenantId: 'tenant-a',
    analytics: { umamiWebsiteId: TENANT_A.websiteId, apiKey: 'key-a' },
  };
  const fallbackEnv = {
    ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID: TENANT_B.websiteId,
    ARCJET_BLOCKED_EVENTS_FALLBACK_TENANT_ID: 'tenant-b',
    ARCJET_BLOCKED_EVENTS_FALLBACK_ANALYTICS_API_KEY: 'key-b',
  };

  test('known host with website id and key -> the tenant website', () => {
    assert.deepEqual(resolveBlockedTrafficTarget(tenant, fallbackEnv), {
      target: TENANT_A,
      attributedTo: 'tenant',
    });
  });

  test('whitespace-only website id counts as missing', () => {
    const result = resolveBlockedTrafficTarget(
      { ...tenant, analytics: { ...tenant.analytics, umamiWebsiteId: '  ' } },
      {},
    );
    assert.deepEqual(result, { target: null, dropped: 'no_website_id' });
  });

  test('unknown host (null config) -> fallback when fully configured', () => {
    assert.deepEqual(resolveBlockedTrafficTarget(null, fallbackEnv), {
      target: TENANT_B,
      attributedTo: 'fallback',
    });
    assert.deepEqual(resolveBlockedTrafficTarget(undefined, fallbackEnv), {
      target: TENANT_B,
      attributedTo: 'fallback',
    });
  });

  test('tenant without a website id -> fallback', () => {
    const result = resolveBlockedTrafficTarget(
      { tenantId: 'tenant-a', analytics: { apiKey: 'key-a' } },
      fallbackEnv,
    );
    assert.deepEqual(result, { target: TENANT_B, attributedTo: 'fallback' });
  });

  test('tenant without an analytics key -> fallback', () => {
    const result = resolveBlockedTrafficTarget(
      {
        tenantId: 'tenant-a',
        analytics: { umamiWebsiteId: TENANT_A.websiteId },
      },
      fallbackEnv,
    );
    assert.deepEqual(result, { target: TENANT_B, attributedTo: 'fallback' });
  });

  test('no fallback configured -> dropped with the specific reason', () => {
    assert.deepEqual(resolveBlockedTrafficTarget(null, {}), {
      target: null,
      dropped: 'no_tenant',
    });
    assert.deepEqual(
      resolveBlockedTrafficTarget(
        { tenantId: 'tenant-a', analytics: { apiKey: 'key-a' } },
        {},
      ),
      { target: null, dropped: 'no_website_id' },
    );
    assert.deepEqual(
      resolveBlockedTrafficTarget(
        {
          tenantId: 'tenant-a',
          analytics: { umamiWebsiteId: TENANT_A.websiteId },
        },
        {},
      ),
      { target: null, dropped: 'no_analytics_key' },
    );
  });

  test('fallback website id without tenant id/key -> dropped as fallback_incomplete', () => {
    assert.deepEqual(
      resolveBlockedTrafficTarget(null, {
        ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID: TENANT_B.websiteId,
      }),
      { target: null, dropped: 'fallback_incomplete' },
    );
  });
});

describe('createBlockedTrafficSender (ISS-2366)', () => {
  test('no API URL: drops, warns exactly once, returns undefined', async () => {
    const { log, entries } = captureLog();
    const { calls, fetch } = fakeFetch();
    const sender = createBlockedTrafficSender({
      apiUrl: undefined,
      log,
      fetch,
    });

    assert.equal(sender.enqueue(TENANT_A, event()), undefined);
    assert.equal(sender.enqueue(TENANT_A, event()), undefined);
    await sender.flush();

    assert.equal(calls.length, 0);
    assert.equal(sender.size(), 0);
    assert.deepEqual(
      entries.map((e) => e.event),
      ['blocked_traffic_sender_disabled'],
    );
  });

  test('queues and flushes after the interval, posting the batch DTO with tenant headers', async () => {
    const { log } = captureLog();
    const { calls, fetch } = fakeFetch();
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example/',
      log,
      fetch,
      flushIntervalMs: 5,
    });

    const p1 = sender.enqueue(TENANT_A, event());
    const p2 = sender.enqueue(TENANT_A, event());
    assert.equal(sender.size(), 2);
    assert.equal(calls.length, 0, 'nothing sent before the interval');
    assert.ok(p1 && p2);
    assert.equal(p1, p2, 'both callers wait on the same timer');

    await p1;

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.example/analytics/events/batch');
    assert.equal(calls[0].init.method, 'POST');
    assert.deepEqual(calls[0].init.headers, {
      'content-type': 'application/json',
      'x-api-version': '1',
      'x-tenant-id': 'tenant-a',
      'x-analytics-api-key': 'key-a',
    });
    assert.equal(calls[0].body.events.length, 2);
    assert.deepEqual(calls[0].body.events[0], event());
    assert.equal(sender.size(), 0);
  });

  test('flushes immediately at flushSize without waiting for the timer', async () => {
    const { log } = captureLog();
    const { calls, fetch } = fakeFetch();
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example',
      log,
      fetch,
      flushIntervalMs: 60_000,
      flushSize: 3,
    });

    const first = sender.enqueue(TENANT_A, event());
    sender.enqueue(TENANT_A, event());
    const third = sender.enqueue(TENANT_A, event());

    await third;
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body.events.length, 3);
    // The earlier caller's timer promise is settled by the size flush too.
    await first;
    assert.equal(sender.size(), 0);
  });

  test('groups by tenant: one POST per tenant, each with its own credentials', async () => {
    const { log } = captureLog();
    const { calls, fetch } = fakeFetch();
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example',
      log,
      fetch,
    });

    sender.enqueue(TENANT_A, event());
    sender.enqueue(TENANT_B, event(TENANT_B.websiteId));
    sender.enqueue(TENANT_A, event());
    await sender.flush();

    assert.equal(calls.length, 2);
    const byTenant = new Map(
      calls.map((c) => [
        (c.init.headers as Record<string, string>)['x-tenant-id'],
        c,
      ]),
    );
    assert.equal(byTenant.get('tenant-a')?.body.events.length, 2);
    assert.equal(
      (byTenant.get('tenant-b')?.init.headers as Record<string, string>)[
        'x-analytics-api-key'
      ],
      'key-b',
    );
    assert.equal(byTenant.get('tenant-b')?.body.events.length, 1);
  });

  test('never sends more than 100 events per request', async () => {
    const { log } = captureLog();
    const { calls, fetch } = fakeFetch();
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example',
      log,
      fetch,
      flushSize: 10_000,
      flushIntervalMs: 60_000,
    });

    for (let i = 0; i < 250; i += 1) sender.enqueue(TENANT_A, event());
    await sender.flush();

    assert.equal(BLOCKED_TRAFFIC_MAX_BATCH, 100);
    assert.deepEqual(
      calls.map((c) => c.body.events.length),
      [100, 100, 50],
    );
  });

  test('drops new events once the queue is full, with a counter', () => {
    const { log, entries } = captureLog();
    const { fetch } = fakeFetch();
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example',
      log,
      fetch,
      flushSize: 10_000,
      flushIntervalMs: 60_000,
      maxQueued: 2,
    });

    assert.ok(sender.enqueue(TENANT_A, event()));
    assert.ok(sender.enqueue(TENANT_A, event()));
    assert.equal(sender.enqueue(TENANT_A, event()), undefined);
    assert.equal(sender.enqueue(TENANT_A, event()), undefined);

    const dropped = entries.filter(
      (e) => e.event === 'blocked_traffic_event_dropped',
    );
    assert.equal(dropped.length, 2);
    assert.equal(dropped[1].data.droppedTotal, 2);
    assert.equal(sender.size(), 2);
  });

  test('a rejected batch is logged and dropped; enqueue/flush never reject', async () => {
    const { log, entries } = captureLog();
    const { fetch } = fakeFetch(() => new Response('nope', { status: 401 }));
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example',
      log,
      fetch,
      flushIntervalMs: 5,
    });

    await sender.enqueue(TENANT_A, event());

    const rejected = entries.find(
      (e) => e.event === 'blocked_traffic_batch_rejected',
    );
    assert.ok(rejected);
    assert.equal(rejected.data.status, 401);
    assert.equal(rejected.data.count, 1);
    assert.equal(sender.size(), 0, 'not retried, not re-queued');
  });

  test('a throwing fetch never propagates', async () => {
    const { log, entries } = captureLog();
    const fetch = (async () => {
      throw new Error('network down');
    }) as typeof fetch;
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example',
      log,
      fetch,
      flushIntervalMs: 5,
    });

    await sender.enqueue(TENANT_A, event());
    await sender.flush();

    const failed = entries.find(
      (e) => e.event === 'blocked_traffic_batch_failed',
    );
    assert.ok(failed);
    assert.equal(failed.data.error, 'network down');
  });

  test('a fetch that throws synchronously never propagates either', async () => {
    const { log, entries } = captureLog();
    const fetch = (() => {
      throw new Error('sync boom');
    }) as unknown as typeof fetch;
    const sender = createBlockedTrafficSender({
      apiUrl: 'https://api.example',
      log,
      fetch,
    });

    sender.enqueue(TENANT_A, event());
    await sender.flush();

    assert.ok(entries.some((e) => e.event === 'blocked_traffic_batch_failed'));
  });
});
