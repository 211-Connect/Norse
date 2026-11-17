import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { busyHeaders, renderBusyPage } from '../src/lib/load-shed/busy-page';
import {
  LOAD_SHED_DEFAULT_MAX_CONCURRENT_PER_TENANT,
  LOAD_SHED_DEFAULT_MAX_PER_MINUTE_PER_TENANT,
  loadShedRouteOf,
  normalizedBasePath,
  parseLimit,
  readLoadShedLimits,
} from '../src/lib/load-shed/config';
import {
  createLoadShedHandler,
  isRscRequest,
} from '../src/lib/load-shed/http-hook';
import {
  createConcurrencyLimiter,
  createMinuteLimiter,
} from '../src/lib/load-shed/limiters';
import {
  clearTenantRegistry,
  rememberTenant,
  tenantForHost,
} from '../src/lib/load-shed/tenant-registry';

describe('load-shed config', () => {
  test('limits default to 20 concurrent and 600 a minute; 0 turns one off', () => {
    assert.deepEqual(readLoadShedLimits({}), {
      maxConcurrentPerTenant: LOAD_SHED_DEFAULT_MAX_CONCURRENT_PER_TENANT,
      maxPerMinutePerTenant: LOAD_SHED_DEFAULT_MAX_PER_MINUTE_PER_TENANT,
    });
    assert.equal(LOAD_SHED_DEFAULT_MAX_CONCURRENT_PER_TENANT, 20);
    assert.equal(LOAD_SHED_DEFAULT_MAX_PER_MINUTE_PER_TENANT, 600);
    assert.deepEqual(
      readLoadShedLimits({
        LOAD_SHED_MAX_CONCURRENT_PER_TENANT: '0',
        LOAD_SHED_MAX_PER_MINUTE_PER_TENANT: '1200',
      }),
      { maxConcurrentPerTenant: 0, maxPerMinutePerTenant: 1200 },
    );
    assert.equal(parseLimit('-3', 7), 7);
    assert.equal(parseLimit('2.5', 7), 7);
    assert.equal(parseLimit('nope', 7), 7);
  });

  test('limits search, search detail and original detail pages, with or without a locale', () => {
    for (const path of [
      '/search',
      '/search/',
      '/en/search',
      '/es/search/abc-123',
      '/zh-Hans/search',
      '/details/original/xyz',
      '/so/details/original/xyz',
    ]) {
      assert.equal(loadShedRouteOf(path, ''), 'page', path);
    }
    assert.equal(loadShedRouteOf('/api/search-pins', ''), 'api');
    for (const path of [
      '/',
      '/en',
      '/en/topics',
      '/en/search/a/b',
      '/details/original',
      '/api/search',
      '/_next/static/chunk.js',
      '/admin',
    ]) {
      assert.equal(loadShedRouteOf(path, ''), null, path);
    }
  });

  test('strips the custom base path', () => {
    assert.equal(normalizedBasePath('/mboa/'), '/mboa');
    assert.equal(normalizedBasePath(undefined), '');
    assert.equal(loadShedRouteOf('/mboa/en/search', '/mboa'), 'page');
    assert.equal(loadShedRouteOf('/mboa/api/search-pins', '/mboa'), 'api');
    assert.equal(loadShedRouteOf('/mboa', '/mboa'), null);
  });
});

describe('concurrency limiter', () => {
  test('allows up to max per key, then refuses until a slot is released', () => {
    const limiter = createConcurrencyLimiter(2);
    const a1 = limiter.tryAcquire('a');
    const a2 = limiter.tryAcquire('a');
    assert.ok(a1 && a2);
    assert.equal(limiter.tryAcquire('a'), null);
    assert.ok(limiter.tryAcquire('b'), 'other tenants are unaffected');

    a1();
    a1(); // idempotent
    assert.equal(limiter.inFlight().get('a'), 1);
    assert.ok(limiter.tryAcquire('a'));
  });

  test('forgets a key once nothing is in flight', () => {
    const limiter = createConcurrencyLimiter(1);
    limiter.tryAcquire('a')?.();
    assert.equal(limiter.inFlight().has('a'), false);
  });
});

describe('minute limiter', () => {
  function setup(answer: (count: number) => Promise<number | null>) {
    const keys: string[] = [];
    const counts = new Map<string, number>();
    let clock = Date.parse('2026-11-17T12:00:10.000Z');
    const allow = createMinuteLimiter({
      max: 3,
      timeoutMs: 20,
      now: () => clock,
      increment: (key) => {
        keys.push(key);
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        return answer(count);
      },
    });
    return {
      allow,
      keys,
      advance: (ms: number) => {
        clock += ms;
      },
    };
  }

  test('allows up to max a minute, then stops asking Redis for the rest of the minute', async () => {
    const { allow, keys, advance } = setup(async (count) => count);
    const results: boolean[] = [];
    for (let i = 0; i < 5; i += 1) results.push(await allow('tenant'));
    assert.deepEqual(results, [true, true, true, false, false]);
    assert.equal(keys.length, 4, 'the 5th request is refused locally');
    assert.match(keys[0], /^loadshed:tenant:\d+$/);

    advance(60_000);
    assert.equal(await allow('tenant'), true, 'a new minute asks again');
    assert.notEqual(keys.at(-1), keys[0]);
  });

  test('fails open when Redis is unavailable or slow', async () => {
    const down = setup(async () => null);
    assert.equal(await down.allow('tenant'), true);

    const failing = setup(() => Promise.reject(new Error('boom')));
    assert.equal(await failing.allow('tenant'), true);

    const slow = setup(
      () => new Promise((resolve) => setTimeout(() => resolve(999), 200)),
    );
    assert.equal(await slow.allow('tenant'), true);
  });
});

describe('tenant registry', () => {
  test('merges what the proxy and the app config know about a host', () => {
    clearTenantRegistry();
    rememberTenant('example.org', { tenantId: 't1', name: 'Example' });
    rememberTenant('example.org', { logoUrl: '/logo.png', name: '' });
    assert.deepEqual(tenantForHost('example.org'), {
      tenantId: 't1',
      name: 'Example',
      logoUrl: '/logo.png',
    });
    assert.equal(tenantForHost('other.org'), undefined);
  });
});

describe('busy page', () => {
  test('is branded, escaped, and has a refresh link', () => {
    const html = renderBusyPage({
      name: 'Help <Line>',
      logoUrl: 'javascript:alert(1)',
      primaryColor: 'red;}body{display:none',
    });
    assert.match(html, /Help &lt;Line&gt;/);
    assert.doesNotMatch(html, /javascript:/);
    assert.doesNotMatch(html, /display:none/);
    assert.match(html, /<a class="button" href="">Refresh<\/a>/);

    const branded = renderBusyPage({
      logoUrl: 'https://cdn.example.org/logo.png',
      primaryColor: '#123abc',
    });
    assert.match(branded, /src="https:\/\/cdn.example.org\/logo.png"/);
    assert.match(branded, /#123abc/);
  });

  test('headers: 429 extras, no caching', () => {
    assert.deepEqual(busyHeaders(true), {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '30',
      'x-robots-tag': 'noindex',
    });
  });
});

describe('HTTP load-shed handler', () => {
  class FakeResponse extends EventEmitter {
    status?: number;
    headers?: Record<string, string>;
    body?: string;
    writeHead(status: number, headers: Record<string, string>) {
      this.status = status;
      this.headers = headers;
      return this;
    }
    end(body?: string) {
      this.body = body;
      return this;
    }
  }

  const request = (
    url: string,
    headers: Record<string, string> = {},
    method = 'GET',
  ) =>
    ({
      url,
      method,
      headers: { host: 'example.org', ...headers },
    }) as unknown as IncomingMessage;

  function setup(max = 1) {
    const shed: unknown[][] = [];
    const handle = createLoadShedHandler({
      limiter: createConcurrencyLimiter(max),
      tenantForHost: (host) =>
        host === 'example.org'
          ? { tenantId: 't1', name: 'Example' }
          : undefined,
      onShed: (...args) => shed.push(args),
      basePath: '',
    });
    return { handle, shed };
  }

  test('passes requests under the limit and releases the slot on close', () => {
    const { handle, shed } = setup(1);
    const first = new FakeResponse();
    assert.equal(
      handle(
        request('/en/search?query=food'),
        first as unknown as ServerResponse,
      ),
      false,
    );

    const second = new FakeResponse();
    assert.equal(
      handle(request('/en/search'), second as unknown as ServerResponse),
      true,
    );
    assert.equal(second.status, 429);
    assert.match(second.body ?? '', /We're busy right now/);
    assert.deepEqual(shed, [['concurrency', 't1', 'example.org']]);

    first.emit('close');
    const third = new FakeResponse();
    assert.equal(
      handle(request('/en/search'), third as unknown as ServerResponse),
      false,
    );
  });

  test('RSC navigations and the pins API get a plain-text 429', () => {
    const { handle } = setup(1);
    handle(
      request('/en/search'),
      new FakeResponse() as unknown as ServerResponse,
    );

    const rsc = new FakeResponse();
    handle(request('/en/search?_rsc=abc'), rsc as unknown as ServerResponse);
    assert.equal(rsc.status, 429);
    assert.equal(rsc.headers?.['content-type'], 'text/plain; charset=utf-8');

    const pins = new FakeResponse();
    handle(request('/api/search-pins'), pins as unknown as ServerResponse);
    assert.equal(pins.status, 429);
    assert.equal(pins.headers?.['content-type'], 'text/plain; charset=utf-8');
  });

  test('ignores other routes and non-GET methods', () => {
    const { handle } = setup(0 + 1);
    handle(
      request('/en/search'),
      new FakeResponse() as unknown as ServerResponse,
    );
    for (const req of [
      request('/en/topics'),
      request('/_next/static/a.js'),
      request('/en/search', {}, 'POST'),
    ]) {
      assert.equal(
        handle(req, new FakeResponse() as unknown as ServerResponse),
        false,
      );
    }
  });

  test('a host with no known tenant is limited by host', () => {
    const { handle, shed } = setup(1);
    handle(
      request('/en/search', { host: 'new.example.org' }),
      new FakeResponse() as unknown as ServerResponse,
    );
    handle(
      request('/en/search', { host: 'new.example.org' }),
      new FakeResponse() as unknown as ServerResponse,
    );
    assert.deepEqual(shed, [['concurrency', undefined, 'new.example.org']]);
  });

  test('isRscRequest reads the rsc header or the _rsc query', () => {
    assert.equal(isRscRequest(request('/en/search', { rsc: '1' })), true);
    assert.equal(isRscRequest(request('/en/search?_rsc=1')), true);
    assert.equal(isRscRequest(request('/en/search')), false);
  });
});
