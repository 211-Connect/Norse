import arcjet, { ArcjetAllowDecision, ArcjetBotReason } from '@arcjet/next';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  ARCJET_SIGNALS_CSP,
  BURST_WARMUP_MINUTES,
  BURST_WARMUP_MIN_FACTOR,
  BurstDetector,
  DecisionSampler,
  KeyedMinuteCap,
  type ArcjetProtectResult,
  buildArcjetRequest,
  buildDecisionRecord,
  clientIpHash,
  clientSignature,
  computeHeaderChecks,
  decisionLogState,
  localeOfPath,
  createArcjetSdkLogger,
  maskNet,
  parseSdkLogCall,
  refererShape,
  requestFeatures,
  routeOfPath,
  samplingConfigFromEnv,
  setClientRequestHeaders,
} from '../src/lib/arcjet';
import {
  emitArcjetDecision,
  setDecisionLogEmitter,
} from '../src/lib/telemetry/arcjet-decision-log';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.60 Safari/537.36';
const CHROME_HEADERS: Record<string, string> = {
  host: 'search.example.org',
  'user-agent': CHROME_UA,
  accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'sec-ch-ua':
    '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-dest': 'document',
  'sec-fetch-user': '?1',
  'x-forwarded-for': '8.8.8.8',
};

/** Server-side view: client headers, our x-norse-* and response headers. */
function serverHeaders(client: Record<string, string>, extra = {}) {
  const h = new Headers(client);
  setClientRequestHeaders(h, {
    method: 'GET',
    clientHeaderNames: Object.keys(client).sort(),
    returning: true,
    search: '?query=food&coords=1,2',
  });
  // What the proxy and i18n router add to the request a page sees.
  h.set('set-cookie', 'session-id=abc');
  h.set('x-middleware-set-cookie', 'NEXT_LOCALE=en');
  h.set('x-frame-options', 'DENY');
  h.set('x-next-i18n-router-locale', 'en');
  for (const [k, v] of Object.entries(extra)) h.set(k, String(v));
  return h;
}

describe('buildArcjetRequest', () => {
  test('method and path are set; the query is never included', () => {
    const { request, context } = buildArcjetRequest({
      headers: serverHeaders(CHROME_HEADERS),
      path: '/en/search?query=crisis',
    });
    assert.equal(request.method, 'GET');
    assert.equal(request.url, '/en/search');
    assert.equal(context.path, '/en/search');
    assert.deepEqual(context.queryKeys, ['coords', 'query']);
    assert.equal(JSON.stringify(request).includes('crisis'), false);
  });

  test('our response headers and x-norse-* / x-middleware-* are dropped', () => {
    const { request } = buildArcjetRequest({
      headers: serverHeaders(CHROME_HEADERS),
      path: '/en/search',
    });
    const names = [...request.headers.keys()];
    for (const bad of [
      'set-cookie',
      'x-middleware-set-cookie',
      'x-frame-options',
      'x-next-i18n-router-locale',
      'x-norse-req-method',
      'x-norse-client-headers',
    ]) {
      assert.equal(names.includes(bad), false, bad);
    }
    assert.equal(request.headers.get('user-agent'), CHROME_UA);
    assert.equal(request.headers.get('x-forwarded-for'), '8.8.8.8');
  });

  test('without the proxy list, a denylist still drops ours', () => {
    const h = new Headers({ ...CHROME_HEADERS, 'x-frame-options': 'DENY' });
    h.set('x-norse-foo', '1');
    h.set('content-security-policy', "default-src 'self'");
    const { request, context } = buildArcjetRequest({ headers: h, path: '/x' });
    assert.equal(context.clientHeaderNamesFromProxy, false);
    assert.equal(request.headers.has('x-frame-options'), false);
    assert.equal(request.headers.has('x-norse-foo'), false);
    assert.equal(request.headers.has('content-security-policy'), false);
    assert.equal(request.headers.get('user-agent'), CHROME_UA);
  });

  test('cookies contain only aj_signals', () => {
    const h = serverHeaders({ ...CHROME_HEADERS, cookie: 'session-id=x' });
    const withSignals = buildArcjetRequest({
      headers: h,
      path: '/en/search',
      ajSignals: 'sig',
    });
    assert.deepEqual(withSignals.request.cookies, { aj_signals: 'sig' });
    assert.equal(withSignals.request.headers.has('cookie'), false);
    assert.equal(withSignals.context.ajSignalsPresent, true);
    const without = buildArcjetRequest({ headers: h, path: '/en/search' });
    assert.deepEqual(without.request.cookies, {});
  });

  test('server actions use the method the proxy recorded', () => {
    const h = serverHeaders(CHROME_HEADERS, { 'x-norse-req-method': 'POST' });
    const { request } = buildArcjetRequest({
      headers: h,
      path: '/en/search',
      defaultMethod: 'GET',
    });
    assert.equal(request.method, 'POST');
  });

  test('SDK level: the request reaching Arcjet has path, method and query ""', async () => {
    let seen: Record<string, unknown> | undefined;
    const client = {
      async decide(_context: unknown, details: Record<string, unknown>) {
        seen = details;
        return new ArcjetAllowDecision({
          ttl: 0,
          results: [],
          reason: new ArcjetBotReason({
            allowed: [],
            denied: [],
            verified: false,
            spoofed: false,
          }),
        });
      },
      report() {},
    };
    const aj = arcjet({
      key: 'ajkey_test',
      rules: [],
      client: client as never,
      log: createArcjetSdkLogger({ otel: () => {}, pino: () => {} }, 'error'),
    });
    const { request } = buildArcjetRequest({
      headers: serverHeaders(CHROME_HEADERS),
      path: '/en/search/123?query=x',
      ajSignals: 'sig',
    });
    await aj.protect(
      request as never,
      {
        correlationId: 'trace-1',
        metadata: { route: 'resource' },
      } as never,
    );
    assert.ok(seen, 'decide was called');
    assert.equal(seen.path, '/en/search/123');
    assert.equal(seen.method, 'GET');
    assert.equal(seen.query, '');
    assert.equal(seen.cookies, 'aj_signals=sig');
    assert.equal(seen.correlationId, 'trace-1');
  });
});

describe('proxy headers', () => {
  test('x-norse-* are always overwritten, even when the client sends them', () => {
    const h = new Headers({
      'x-norse-req-method': 'DELETE',
      'x-norse-client-headers': 'forged',
      'x-norse-client-returning': '1',
      'x-norse-query-keys': 'forged',
    });
    setClientRequestHeaders(h, {
      method: 'GET',
      clientHeaderNames: ['host', 'user-agent'],
      returning: false,
      search: '?b=2&a=1&a=3',
    });
    assert.equal(h.get('x-norse-req-method'), 'GET');
    assert.equal(h.get('x-norse-client-headers'), 'host,user-agent');
    assert.equal(h.get('x-norse-client-returning'), '0');
    assert.equal(h.get('x-norse-query-keys'), 'a,b');
  });

  test('CSP sources include the signals domains and wasm-unsafe-eval', () => {
    assert.ok(ARCJET_SIGNALS_CSP.scriptSrc.includes("'wasm-unsafe-eval'"));
    assert.ok(
      ARCJET_SIGNALS_CSP.scriptSrc.includes('https://signals-cdn.arcjet.com'),
    );
    assert.ok(
      ARCJET_SIGNALS_CSP.connectSrc.includes('https://signals.arcjet.com'),
    );
    assert.ok(
      ARCJET_SIGNALS_CSP.frameSrc.includes('https://signals-cdn.arcjet.com'),
    );
  });

  test('routeOfPath', () => {
    assert.equal(routeOfPath('/en/search'), 'search');
    assert.equal(routeOfPath('/search'), 'search');
    assert.equal(routeOfPath('/en/search/abc'), 'resource');
    assert.equal(routeOfPath('/en/details/original/1'), 'details');
    assert.equal(routeOfPath('/api/search-pins'), 'pins');
    assert.equal(routeOfPath('/en'), 'other');
  });
});

describe('dev findings (2026-11-18)', () => {
  test('accept-language quality weights survive the collector q= backstop', () => {
    const h = new Headers({
      ...CHROME_HEADERS,
      accept: 'text/html;q=0.9,*/*;q=0.8',
    });
    const { context } = buildArcjetRequest({ headers: h, path: '/en/search' });
    const { fields } = requestFeatures(h, context);
    assert.equal(fields.h_accept_language, 'en-US,en;q:0.9');
    assert.equal(fields.h_accept, 'text/html;q:0.9,*/*;q:0.8');
  });

  test('an /api path has no locale', () => {
    assert.equal(localeOfPath('/api/search-pins'), '');
    assert.equal(localeOfPath('/en/search'), 'en');
  });

  test('without the proxy, client_returning comes from the session cookie', () => {
    const h = new Headers(CHROME_HEADERS);
    const yes = buildArcjetRequest({
      headers: h,
      path: '/api/search-pins',
      hasSessionCookie: true,
    });
    const no = buildArcjetRequest({
      headers: h,
      path: '/api/search-pins',
      hasSessionCookie: false,
    });
    assert.equal(yes.context.clientReturning, true);
    assert.equal(no.context.clientReturning, false);
    // The proxy's header wins when present.
    const proxied = buildArcjetRequest({
      headers: serverHeaders(CHROME_HEADERS),
      path: '/en/search',
      hasSessionCookie: false,
    });
    assert.equal(proxied.context.clientReturning, true);
  });

  test('one burst detector and sampler per process (shared across bundles)', () => {
    assert.equal(decisionLogState(), decisionLogState());
    assert.ok(decisionLogState().burst instanceof BurstDetector);
  });
});

describe('referer shape', () => {
  test('https://host → ref_path_empty', () => {
    const s = refererShape(
      'https://search.example.org',
      null,
      'search.example.org',
    );
    assert.equal(s.ref_path_empty, true);
    assert.equal(s.ref_path_root, false);
    assert.equal(s.ref_same_host, true);
  });

  test('https://host/ → ref_path_root', () => {
    const s = refererShape(
      'https://search.example.org/',
      null,
      'search.example.org',
    );
    assert.equal(s.ref_path_empty, false);
    assert.equal(s.ref_path_root, true);
  });

  test('https://host/x?q=1 → neither, ref_has_query, no path or query stored', () => {
    const s = refererShape(
      'https://other.example.org/x?q=secret',
      'https://search.example.org',
      'search.example.org',
    );
    assert.equal(s.ref_path_empty, false);
    assert.equal(s.ref_path_root, false);
    assert.equal(s.ref_has_query, true);
    assert.equal(s.ref_host, 'other.example.org');
    assert.equal(s.ref_same_host, false);
    assert.equal(s.origin_same_host, true);
    const stored = JSON.stringify(s);
    assert.equal(stored.includes('/x'), false);
    assert.equal(stored.includes('secret'), false);
  });

  test('checks flag the path-less referer', () => {
    const h = new Headers({
      ...CHROME_HEADERS,
      referer: 'https://search.example.org',
    });
    const shape = refererShape(h.get('referer'), null, 'search.example.org');
    assert.ok(computeHeaderChecks(h, shape).includes('referer_path_empty'));
  });
});

describe('client_signature', () => {
  const shape = refererShape(null, null, 'search.example.org');
  const names = Object.keys(CHROME_HEADERS).sort();

  test('stable across IPs and user-agent minor versions', () => {
    const a = new Headers(CHROME_HEADERS);
    const b = new Headers({
      ...CHROME_HEADERS,
      'x-forwarded-for': '1.2.3.4',
      'user-agent': CHROME_UA.replace('142.0.7444.60', '142.0.7444.175'),
    });
    assert.equal(
      clientSignature(a, shape, names),
      clientSignature(b, shape, names),
    );
    assert.match(clientSignature(a, shape, names), /^[0-9a-f]{12}$/);
  });

  test('different for real Chrome vs a bot with partial Chrome headers', () => {
    const bot = new Headers({
      host: 'search.example.org',
      'user-agent': CHROME_UA,
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'x-forwarded-for': '1.2.3.4',
    });
    const botShape = refererShape(
      'https://search.example.org',
      null,
      'search.example.org',
    );
    assert.notEqual(
      clientSignature(new Headers(CHROME_HEADERS), shape, names),
      clientSignature(bot, botShape, [...bot.keys()].sort()),
    );
  });
});

describe('decision sampling', () => {
  const config = samplingConfigFromEnv({});
  const base = {
    route: 'search',
    host: 'h',
    traceSampled: false,
    burst: false,
  };

  test('the deny cap applies per (reason_type, denied_bots) key', () => {
    const t = 60_000 * 10;
    const s = new DecisionSampler(config, () => t);
    const take = (bots: string[]) =>
      s.decide({
        ...base,
        conclusion: 'DENY',
        reasonType: 'BOT',
        deniedBots: bots,
      }).log;
    const curl = Array.from({ length: 10 }, () => take(['CURL']));
    assert.equal(curl.filter(Boolean).length, config.denyPerMinute);
    // Another key has its own budget.
    assert.equal(take(['PYTHON_REQUESTS']), true);
  });

  test('the next logged denial carries sampled_out_since_last', () => {
    let t = 60_000 * 10;
    const s = new DecisionSampler(config, () => t);
    const d = () =>
      s.decide({
        ...base,
        conclusion: 'DENIED_NOT_ENFORCED',
        reasonType: 'BOT',
        deniedBots: ['X'],
      });
    for (let i = 0; i < config.denyPerMinute + 3; i++) d();
    t += 60_000;
    assert.deepEqual(d(), { log: true, sampledOutSinceLast: 3 });
  });

  test('print is always logged; ALLOW only when sampled or in burst', () => {
    const s = new DecisionSampler(config, () => 0);
    for (let i = 0; i < 50; i++) {
      assert.equal(
        s.decide({ ...base, route: 'print', conclusion: 'ALLOW' }).log,
        true,
      );
    }
    assert.equal(s.decide({ ...base, conclusion: 'ALLOW' }).log, false);
    assert.equal(
      s.decide({ ...base, conclusion: 'ALLOW', traceSampled: true }).log,
      true,
    );
    assert.equal(
      s.decide({ ...base, conclusion: 'ALLOW', burst: true }).log,
      true,
    );
    assert.equal(
      s.decide({ ...base, conclusion: 'SKIPPED', traceSampled: true }).log,
      false,
    );
  });

  test('the hard cap holds', () => {
    const s = new DecisionSampler({ ...config, maxPerMinute: 10 }, () => 0);
    let n = 0;
    for (let i = 0; i < 50; i++) {
      if (s.decide({ ...base, route: 'print', conclusion: 'ALLOW' }).log) n++;
    }
    assert.equal(n, 10);
  });

  test('burst mode starts above the minimum and 5x baseline, logs ALLOWs, and ends', () => {
    let t = 0;
    const d = new BurstDetector(config, () => t);
    // 30 quiet minutes at 10/min: never a burst.
    for (let m = 0; m < 30; m++) {
      for (let i = 0; i < 10; i++) {
        t = m * 60_000 + i * 5_000;
        assert.equal(d.record('h'), false);
      }
    }
    // A flood: 60 calls in 30 s.
    let on = false;
    for (let i = 0; i < 60; i++) {
      t = 30 * 60_000 + i * 500;
      on = d.record('h');
    }
    assert.equal(on, true);
    assert.deepEqual(d.activeHosts(), ['h']);
    // It lasts 5 minutes after the last minute that met it.
    t += config.burstDurationMs + 1;
    assert.equal(d.isBurst('h'), false);
  });

  test('warm-up: normal traffic on a fresh instance is not a burst', () => {
    let t = 0;
    const d = new BurstDetector(config, () => t);
    // 60 calls a minute from the very first minute: above the minimum (40)
    // but under the warm-up bar (120), and no baseline yet.
    for (let m = 0; m < BURST_WARMUP_MINUTES; m++) {
      for (let i = 0; i < 60; i++) {
        t = m * 60_000 + i * 1_000;
        assert.equal(d.record('h'), false, `minute ${m}`);
      }
    }
    // Same steady rate after the warm-up: the baseline has caught up.
    for (let i = 0; i < 60; i++) {
      t = BURST_WARMUP_MINUTES * 60_000 + i * 1_000;
      d.record('h');
    }
    assert.equal(d.isBurst('h'), false);
  });

  test('warm-up: a large flood right after a restart is a burst', () => {
    let t = 0;
    const d = new BurstDetector(config, () => t);
    const bar = config.burstMinPerInstance * BURST_WARMUP_MIN_FACTOR;
    assert.equal(bar, 120);
    let on = false;
    // 200 calls in the first 50 seconds after start.
    for (let i = 0; i < 200; i++) {
      t = i * 250;
      on = d.record('h');
      if (i < bar) assert.equal(on, false, `call ${i}`);
    }
    assert.equal(on, true);
  });

  test('warm-up: steady high traffic on a fresh instance learns its baseline and leaves burst', () => {
    let t = 0;
    const d = new BurstDetector(config, () => t);
    // 150 calls a minute for 30 minutes: above the warm-up bar, but steady.
    for (let m = 0; m < 30; m++) {
      for (let i = 0; i < 150; i++) {
        t = m * 60_000 + i * 400;
        d.record('h');
      }
    }
    // Flagged during warm-up; afterwards the learned baseline (~150) puts
    // the 5x test out of reach, and the 5-minute burst has expired.
    assert.equal(d.isBurst('h'), false);
  });

  test('KeyedMinuteCap resets each minute', () => {
    let t = 0;
    const cap = new KeyedMinuteCap(2, () => t);
    assert.equal(cap.take('k'), 0);
    assert.equal(cap.take('k'), 0);
    assert.equal(cap.take('k'), undefined);
    t = 60_000;
    assert.equal(cap.take('k'), 1);
  });
});

describe('arcjet_decision record', () => {
  const result: ArcjetProtectResult = {
    denied: false,
    conclusion: 'ALLOW',
    decisionId: 'req_1',
    reasonType: 'BOT',
    timing: { durationMs: 12, eventLoopUtilization: 0.1 },
  };

  function recordOf(headers: Record<string, string>) {
    const built = buildArcjetRequest({
      headers: serverHeaders(headers),
      path: '/en/search',
    });
    return buildDecisionRecord({
      result,
      enforced: false,
      route: 'print',
      tenantId: 't-1',
      context: built.context,
      features: requestFeatures(built.request.headers, built.context),
      request: built.request,
      burst: true,
      idsRequested: 120,
      idsUnique: 100,
      ipHashKey: 'k',
      now: new Date('2026-11-18T00:00:00Z'),
    });
  }

  test('carries the generic fields and never the IP, query values or cookies', () => {
    const r = recordOf({
      ...CHROME_HEADERS,
      referer: 'https://search.example.org',
      cookie: 'session-id=secret',
    });
    assert.equal(r.route, 'print');
    assert.equal(r.ids_requested, 120);
    assert.equal(r.ids_unique, 100);
    assert.equal(r.h_user_agent, CHROME_UA);
    assert.equal(r.ref_path_empty, true);
    assert.equal(r.client_net, '8.8.x.x');
    assert.equal(r.query_keys, 'coords,query');
    assert.equal(r.client_returning, true);
    assert.equal(r.burst, true);
    assert.match(String(r.client_ip_hash), /^[0-9a-f]{12}$/);
    const json = JSON.stringify(r);
    for (const leak of ['8.8.8.8', 'secret', 'food', 'session-id=']) {
      assert.equal(json.includes(leak), false, leak);
    }
    // No collector-deleted names.
    for (const key of ['ip', 'client_ip', 'query', 'q', 'user_agent']) {
      assert.equal(key in r, false, key);
    }
  });

  test('client_ip_hash rotates daily and is off without a key', () => {
    const d1 = clientIpHash('8.8.8.8', 'k', new Date('2026-11-18T10:00:00Z'));
    const d1b = clientIpHash('8.8.8.8', 'k', new Date('2026-11-18T23:00:00Z'));
    const d2 = clientIpHash('8.8.8.8', 'k', new Date('2026-11-19T00:00:00Z'));
    assert.equal(d1, d1b);
    assert.notEqual(d1, d2);
    assert.equal(clientIpHash('8.8.8.8', undefined), undefined);
  });

  test('maskNet: /16 for IPv4, /48 for IPv6', () => {
    assert.equal(maskNet('8.8.4.4'), '8.8.x.x');
    assert.equal(maskNet('2001:db8:85a3::1'), '2001:db8:85a3:x');
  });

  test('the emitter flattens arrays and never throws', () => {
    const seen: unknown[] = [];
    setDecisionLogEmitter((r) => seen.push(r));
    try {
      emitArcjetDecision({
        conclusion: 'ERROR',
        denied_bots: ['A', 'B'],
        x: undefined,
      });
      setDecisionLogEmitter(() => {
        throw new Error('boom');
      });
      assert.doesNotThrow(() => emitArcjetDecision({ conclusion: 'ALLOW' }));
    } finally {
      setDecisionLogEmitter(undefined);
    }
    assert.deepEqual(seen, [
      {
        body: 'arcjet_decision',
        severityNumber: 13,
        severityText: 'WARN',
        attributes: {
          event: 'arcjet_decision',
          conclusion: 'ERROR',
          denied_bots: 'A,B',
        },
      },
    ]);
  });
});

describe('Arcjet SDK log adapter', () => {
  test('debug/info go to OTel only, warn/error to pino; both call forms', () => {
    const otel: unknown[] = [];
    const pino: unknown[] = [];
    const logger = createArcjetSdkLogger(
      {
        otel: (level, message, data) => otel.push([level, message, data]),
        pino: (level, data, message) => pino.push([level, data, message]),
      },
      'debug',
    );
    logger.debug('LATENCY %s: %sms', 'decide', 12);
    logger.info({ rule: 'bot' }, 'rule %s', 'ok');
    logger.warn('Client IP address is missing');
    logger.error({ err: 'x' }, 'failed');
    assert.deepEqual(otel, [
      ['debug', 'LATENCY decide: 12ms', {}],
      ['info', 'rule ok', { rule: 'bot' }],
    ]);
    assert.deepEqual(pino, [
      ['warn', { event: 'arcjet_sdk' }, 'Client IP address is missing'],
      ['error', { event: 'arcjet_sdk', err: 'x' }, 'failed'],
    ]);
  });

  test('levels below ARCJET_LOG_LEVEL are dropped (default warn)', () => {
    const otel: unknown[] = [];
    const logger = createArcjetSdkLogger(
      { otel: (...a) => otel.push(a), pino: () => {} },
      undefined,
    );
    logger.debug('x');
    logger.info('y');
    assert.equal(otel.length, 0);
    assert.deepEqual(parseSdkLogCall({ a: 1 }, []), {
      message: '',
      data: { a: 1 },
    });
  });
});
