import {
  ArcjetAllowDecision,
  ArcjetBotReason,
  ArcjetDenyDecision,
  ArcjetErrorDecision,
  ArcjetErrorReason,
  type ArcjetDecision,
} from '@arcjet/next';
import { NextRequest } from 'next/server';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  ARCJET_ALLOWED_BOTS,
  type ArcjetLog,
  FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE,
  MBOA_PROXY_IP,
  createArcjetProtect,
  createMinuteSampler,
  maskIp,
  redactHeaders,
  resolveArcjetClientIp,
} from '../src/lib/arcjet';

type LogEntry = { level: string; event: string; data: Record<string, unknown> };

function captureLog(): { log: ArcjetLog; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return {
    entries,
    log: (level, event, data) => entries.push({ level, event, data }),
  };
}

function makeRequest(
  headers: Record<string, string> = {},
  path = '/en/search?q=food',
) {
  return new NextRequest(`https://example.org${path}`, {
    headers: { host: 'example.org', ...headers },
  });
}

const denyBots = (denied: string[]) =>
  new ArcjetDenyDecision({
    ttl: 0,
    results: [],
    reason: new ArcjetBotReason({
      allowed: [],
      denied,
      verified: false,
      spoofed: false,
    }),
  });

const allow = () =>
  new ArcjetAllowDecision({
    ttl: 0,
    results: [],
    reason: new ArcjetBotReason({
      allowed: ['GOOGLE_CRAWLER'],
      denied: [],
      verified: true,
      spoofed: false,
    }),
  });

const FINGERPRINT_ERROR =
  'Failed to build fingerprint - requested `ip` characteristic but the `ip` value was empty';

const errored = () =>
  new ArcjetErrorDecision({
    ttl: 0,
    results: [],
    reason: new ArcjetErrorReason(FINGERPRINT_ERROR),
  });

const clientReturning = (decision: ArcjetDecision) => ({
  protect: async () => decision,
});

// A Cloudflare edge address (173.245.48.0/20 is a published Cloudflare range).
const CLOUDFLARE_IP = '173.245.48.10';
// Must be a globally routable address: Arcjet skips reserved ranges such as
// TEST-NET (203.0.113.0/24) when walking x-forwarded-for, so those would
// resolve to '' and make this test pass for the wrong reason.
const CLIENT_IP = '8.8.8.8';
const SENSITIVE_HEADERS = {
  cookie: 'session=secret',
  authorization: 'Bearer secret-token',
  'x-forwarded-for': '203.0.113.77, 10.0.0.1',
  'do-connecting-ip': '198.51.100.9',
  'cf-connecting-ip': '192.0.2.44',
  'x-real-ip': '2001:db8:85a3::8a2e:370:7334',
  'user-agent': 'TestAgent/1.0',
};

describe('allow list (ISS-2305)', () => {
  test('is exactly the measured list, in order', () => {
    assert.deepEqual(
      [...ARCJET_ALLOWED_BOTS],
      [
        'CATEGORY:SEARCH_ENGINE',
        'CATEGORY:PREVIEW',
        'CATEGORY:MONITOR',
        'FACEBOOK_CRAWLER',
        'SITEIMPROVE_CRAWLER',
        'NAVER_CRAWLER',
        'BAIDU_CRAWLER',
      ],
    );
  });
});

describe('arcjetProtect enforcement (ISS-1728)', () => {
  test('denied decision returns denied result with flat deniedBots', async () => {
    const protect = createArcjetProtect(
      clientReturning(denyBots(['CURL', 'PYTHON_REQUESTS'])),
    );
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), log);

    assert.equal(result.denied, true);
    assert.equal(result.conclusion, 'DENY');
    assert.deepEqual(result.denied && result.deniedBots, [
      'CURL',
      'PYTHON_REQUESTS',
    ]);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].level, 'warn');
    assert.equal(entries[0].event, 'arcjet_denied');
    assert.deepEqual(entries[0].data.deniedBots, ['CURL', 'PYTHON_REQUESTS']);
    assert.equal(entries[0].data.host, 'example.org');
    assert.equal(entries[0].data.pathName, '/en/search?q=food');
    assert.ok(entries[0].data.reason);
  });

  test('allowed decision passes without logging', async () => {
    const protect = createArcjetProtect(clientReturning(allow()));
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), log);

    assert.equal(result.denied, false);
    assert.equal(result.conclusion, 'ALLOW');
    assert.equal(entries.length, 0);
  });

  test('missing ARCJET_KEY (no client) is a no-op', async () => {
    const protect = createArcjetProtect(undefined);
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), log);

    assert.deepEqual(result, { denied: false, conclusion: 'SKIPPED' });
    assert.equal(entries.length, 0);
  });

  test('denied log reports the IP Arcjet resolves, not the MBOA proxy', async () => {
    const protect = createArcjetProtect(clientReturning(denyBots(['CURL'])));
    const { log, entries } = captureLog();
    const req = makeRequest({
      'x-forwarded-for': `${CLIENT_IP}, 10.215.199.3,${MBOA_PROXY_IP},${CLOUDFLARE_IP}`,
      'do-connecting-ip': MBOA_PROXY_IP,
    });

    await protect(req, log);

    assert.equal(entries[0].data.ip, CLIENT_IP);
    assert.equal(entries[0].data.doConnectingIp, MBOA_PROXY_IP);
  });
});

describe('fingerprint failure logging (ISS-1734)', () => {
  test('thrown SDK error fails open and logs redacted headers', async () => {
    const protect = createArcjetProtect(
      {
        protect: async () => {
          throw new TypeError(FINGERPRINT_ERROR);
        },
      },
      { sampleHeaderLog: () => true },
    );
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(SENSITIVE_HEADERS), log);

    assert.deepEqual(result, { denied: false, conclusion: 'THREW' });
    assert.equal(entries.length, 1);
    const entry = entries[0];
    assert.equal(entry.level, 'warn');
    assert.equal(entry.event, 'arcjet_fingerprint_failed');
    assert.equal(entry.data.conclusion, 'THREW');
    assert.equal(entry.data.errorType, 'TypeError');
    assert.equal(entry.data.message, FINGERPRINT_ERROR);
    assert.equal(entry.data.host, 'example.org');
    assert.equal(entry.data.pathName, '/en/search?q=food');

    const headers = entry.data.headers as Record<string, string>;
    assert.equal('cookie' in headers, false);
    assert.equal('authorization' in headers, false);
    assert.equal(headers['x-forwarded-for'], '203.0.x.x, 10.0.x.x');
    assert.equal(headers['do-connecting-ip'], '198.51.x.x');
    assert.equal(headers['cf-connecting-ip'], '192.0.x.x');
    assert.equal(headers['x-real-ip'], '2001:db8:x');
    assert.equal(headers['user-agent'], 'TestAgent/1.0');
    assert.equal(headers.host, 'example.org');
    assert.equal(JSON.stringify(entry).includes('secret'), false);
  });

  test('ERROR conclusion fails open and logs the SDK error message', async () => {
    const protect = createArcjetProtect(clientReturning(errored()), {
      sampleHeaderLog: () => true,
    });
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(SENSITIVE_HEADERS), log);

    assert.deepEqual(result, { denied: false, conclusion: 'ERROR' });
    assert.equal(entries[0].event, 'arcjet_fingerprint_failed');
    assert.equal(entries[0].data.conclusion, 'ERROR');
    assert.equal(entries[0].data.errorType, 'ERROR');
    assert.equal(entries[0].data.message, FINGERPRINT_ERROR);
    assert.ok(entries[0].data.headers);
  });

  test('sampled-out failures log a counter event without headers', async () => {
    const protect = createArcjetProtect(clientReturning(errored()), {
      sampleHeaderLog: () => false,
    });
    const { log, entries } = captureLog();

    await protect(makeRequest(SENSITIVE_HEADERS), log);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].event, 'arcjet_fingerprint_failed_sampled_out');
    assert.equal('headers' in entries[0].data, false);
    assert.equal(entries[0].data.message, FINGERPRINT_ERROR);
    assert.equal(JSON.stringify(entries[0]).includes('secret'), false);
  });

  test('default sampler emits at most N header events per minute', async () => {
    let now = 60_000 * 100;
    const sampler = createMinuteSampler(
      FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE,
      () => now,
    );
    const protect = createArcjetProtect(clientReturning(errored()), {
      sampleHeaderLog: sampler,
    });
    const { log, entries } = captureLog();

    for (let i = 0; i < FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE + 10; i++) {
      await protect(makeRequest(), log);
    }
    const withHeaders = entries.filter(
      (e) => e.event === 'arcjet_fingerprint_failed',
    );
    assert.equal(withHeaders.length, FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE);
    assert.equal(entries.length, FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE + 10);

    now += 60_000;
    await protect(makeRequest(), log);
    assert.equal(entries.at(-1)?.event, 'arcjet_fingerprint_failed');
  });
});

describe('helpers', () => {
  test('maskIp keeps the first two octets / groups', () => {
    assert.equal(maskIp('203.0.113.77'), '203.0.x.x');
    assert.equal(maskIp(' 10.1.2.3 '), '10.1.x.x');
    assert.equal(maskIp('2001:db8::1'), '2001:db8:x');
    assert.equal(maskIp(''), '');
  });

  test('redactHeaders drops set-cookie too', () => {
    const headers = new Headers({ 'set-cookie': 'a=b', 'x-id': '1' });
    assert.deepEqual(redactHeaders(headers), { 'x-id': '1' });
  });

  test('resolveArcjetClientIp walks past trusted proxies and private hops', () => {
    const req = makeRequest({
      'x-forwarded-for': `${CLIENT_IP}, 10.215.199.3,${MBOA_PROXY_IP},${CLOUDFLARE_IP}`,
    });
    assert.equal(resolveArcjetClientIp(req), CLIENT_IP);
  });

  test('resolveArcjetClientIp returns unknown with no usable header', () => {
    assert.equal(resolveArcjetClientIp(makeRequest()), 'unknown');
  });
});
