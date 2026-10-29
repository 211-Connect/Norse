import {
  ArcjetAllowDecision,
  ArcjetBotReason,
  ArcjetDenyDecision,
  ArcjetErrorDecision,
  ArcjetErrorReason,
  ArcjetFilterReason,
  ArcjetRuleResult,
  type ArcjetDecision,
} from '@arcjet/next';
import { NextRequest } from 'next/server';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createCircuitBreaker } from '../src/utilities/circuitBreaker';
import {
  ARCJET_ALLOWED_BOTS,
  ARCJET_CIRCUIT_FAILURE_THRESHOLD,
  ARCJET_DEFAULT_TIMEOUT_MS,
  ARCJET_ENFORCEMENT,
  DENIED_LOG_MAX_PER_MINUTE,
  type ArcjetEnforcement,
  NO_CLIENT_IP_BYPASS_HOST,
  NO_USER_AGENT_FILTER,
  buildArcjetRules,
  type ArcjetLog,
  FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE,
  MBOA_PROXY_IP,
  createArcjetProtect,
  createMinuteSampler,
  internalIpSrc,
  isArcjetUnavailableError,
  maskIp,
  normalizeHost,
  parseHostList,
  parseTimeoutMs,
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

// A Cloudflare edge address (173.245.48.0/20 is a published Cloudflare range).
const CLOUDFLARE_IP = '173.245.48.10';
// Must be a globally routable address: Arcjet skips reserved ranges such as
// TEST-NET (203.0.113.0/24) when walking x-forwarded-for, so those would
// resolve to '' and make this test pass for the wrong reason.
const CLIENT_IP = '8.8.8.8';

/** The path the page passes to `arcjetProtect` (never a query string). */
const PATH = '/en/search';

/** A request with a routable client so the Arcjet client is reached. */
function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest(`https://example.org${PATH}?q=food`, {
    headers: { host: 'example.org', 'x-forwarded-for': CLIENT_IP, ...headers },
  });
}

/** Enforcement in tests; production reads it from env. */
const enforcement = (enforced: string, unenforced = ''): ArcjetEnforcement => ({
  enforced: parseHostList(enforced),
  unenforced: parseHostList(unenforced),
});
const ENFORCED = enforcement('example.org');

const createProtect = (
  client: Parameters<typeof createArcjetProtect>[0],
  options: Parameters<typeof createArcjetProtect>[1] = {},
) => createArcjetProtect(client, { enforcement: ENFORCED, ...options });

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

const SENSITIVE_HEADERS = {
  cookie: 'session=secret',
  authorization: 'Bearer secret-token',
  'x-forwarded-for': '8.8.4.4, 10.0.0.1',
  'do-connecting-ip': '198.51.100.9',
  'cf-connecting-ip': '192.0.2.44',
  'x-real-ip': '2001:db8:85a3::8a2e:370:7334',
  'user-agent': 'TestAgent/1.0',
  referer: 'https://example.org/en/search?q=secret-crisis-query',
  'x-custom-header': 'not-on-the-allowlist',
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
        'GOOGLE_LIGHTHOUSE',
        'OPENAI_CRAWLER_USER',
        'OPENAI_CRAWLER_SEARCH',
        'PERPLEXITY_USER',
        'ANTHROPIC_CRAWLER_USER',
      ],
    );
  });
});

describe('arcjetProtect enforcement (ISS-1728)', () => {
  test('denied decision returns denied result with flat deniedBots', async () => {
    const protect = createProtect(
      clientReturning(denyBots(['CURL', 'PYTHON_REQUESTS'])),
    );
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), PATH, log);

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
    assert.equal(entries[0].data.pathName, PATH);
    assert.ok(entries[0].data.reason);
  });

  test('allowed decision passes without logging', async () => {
    const protect = createProtect(clientReturning(allow()));
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), PATH, log);

    assert.equal(result.denied, false);
    assert.equal(result.conclusion, 'ALLOW');
    assert.equal(entries.length, 0);
  });

  test('missing ARCJET_KEY (no client) is a no-op', async () => {
    const protect = createProtect(undefined);
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), PATH, log);

    assert.deepEqual(result, { denied: false, conclusion: 'SKIPPED' });
    assert.equal(entries.length, 0);
  });

  test('decision logs carry the decisionId and no IP address', async () => {
    const decision = denyBots(['CURL']);
    const protect = createProtect(clientReturning(decision));
    const { log, entries } = captureLog();
    const req = makeRequest({
      'x-forwarded-for': `${CLIENT_IP}, 10.215.199.3,${MBOA_PROXY_IP},${CLOUDFLARE_IP}`,
      'do-connecting-ip': MBOA_PROXY_IP,
    });

    await protect(req, PATH, log);

    assert.equal(entries[0].data.decisionId, decision.id);
    assert.equal('ip' in entries[0].data, false);
    assert.equal('doConnectingIp' in entries[0].data, false);
    const logged = JSON.stringify(entries[0]);
    for (const ip of [CLIENT_IP, MBOA_PROXY_IP, CLOUDFLARE_IP, '10.215']) {
      assert.equal(logged.includes(ip), false, ip);
    }
  });

  test('arcjet_denied is sampled; the next line counts what was dropped', async () => {
    let allowLine = true;
    const protect = createProtect(clientReturning(denyBots(['CURL'])), {
      sampleDeniedLog: () => allowLine,
    });
    const { log, entries } = captureLog();

    await protect(makeRequest(), PATH, log);
    allowLine = false;
    for (let i = 0; i < 3; i++) {
      const result = await protect(makeRequest(), PATH, log);
      assert.equal(
        result.conclusion,
        'DENY',
        'sampling never changes the decision',
      );
    }
    allowLine = true;
    await protect(makeRequest(), PATH, log);

    assert.equal(entries.length, 2);
    assert.equal(entries[0].data.sampledOutSinceLast, 0);
    assert.equal(entries[1].data.sampledOutSinceLast, 3);
  });

  test('default denied sampler logs at most N lines per minute', async () => {
    const protect = createProtect(clientReturning(denyBots(['CURL'])));
    const { log, entries } = captureLog();
    for (let i = 0; i < DENIED_LOG_MAX_PER_MINUTE + 5; i++) {
      await protect(makeRequest(), PATH, log);
    }
    // A minute boundary inside the loop can only allow more, never fewer.
    assert.ok(entries.length >= DENIED_LOG_MAX_PER_MINUTE);
    assert.ok(entries.length < DENIED_LOG_MAX_PER_MINUTE + 5);
  });
});

describe('no-User-Agent filter rule (ISS-1744)', () => {
  const filterReason = () =>
    new ArcjetFilterReason({
      matchedExpressions: [NO_USER_AGENT_FILTER],
      undeterminedExpressions: [],
    });

  const filterRuleResult = (state: 'DRY_RUN' | 'RUN') =>
    new ArcjetRuleResult({
      ruleId: 'filter-rule',
      fingerprint: 'fp',
      ttl: 0,
      state,
      conclusion: 'DENY',
      reason: filterReason(),
    });

  test('DRY_RUN match: decision stays allowed and is logged once', async () => {
    const decision = new ArcjetAllowDecision({
      ttl: 0,
      results: [filterRuleResult('DRY_RUN')],
      reason: new ArcjetBotReason({
        allowed: [],
        denied: [],
        verified: false,
        spoofed: false,
      }),
    });
    const protect = createProtect(clientReturning(decision));
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), PATH, log);

    assert.deepEqual(result, { denied: false, conclusion: 'ALLOW' });
    assert.equal(entries.length, 1);
    assert.equal(entries[0].event, 'arcjet_dry_run_match');
    assert.equal(entries[0].data.ruleType, 'filter');
    assert.equal(entries[0].data.host, 'example.org');
    assert.equal(entries[0].data.pathName, PATH);
    assert.deepEqual(entries[0].data.matchedExpressions, [
      NO_USER_AGENT_FILTER,
    ]);
  });

  test('LIVE filter denial: denied with reasonType FILTER and no bots', async () => {
    const decision = new ArcjetDenyDecision({
      ttl: 0,
      results: [filterRuleResult('RUN')],
      reason: filterReason(),
    });
    const protect = createProtect(clientReturning(decision));
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), PATH, log);

    assert.deepEqual(result, {
      denied: true,
      conclusion: 'DENY',
      deniedBots: [],
      reasonType: 'FILTER',
    });
    assert.equal(entries.length, 1);
    assert.equal(entries[0].event, 'arcjet_denied');
    assert.equal(entries[0].data.reasonType, 'FILTER');
    assert.deepEqual(entries[0].data.deniedBots, []);
    assert.equal(entries[0].data.enforced, true);
  });

  test('bot denial logs reasonType BOT', async () => {
    const protect = createProtect(clientReturning(denyBots(['CURL'])));
    const { log, entries } = captureLog();
    await protect(makeRequest(), PATH, log);
    assert.equal(entries[0].data.reasonType, 'BOT');
  });

  test('rules contain the filter in DRY_RUN with exactly the expression', () => {
    // Each rule factory returns a one-element tuple; flatten to inspect.
    const rules = buildArcjetRules().flat();
    const filters = rules.filter((r) => r.type === 'FILTER');
    assert.equal(filters.length, 1);
    assert.equal(filters[0].mode, 'DRY_RUN');
    assert.deepEqual([...filters[0].deny], [NO_USER_AGENT_FILTER]);
    assert.equal(
      NO_USER_AGENT_FILTER,
      'len(http.request.headers["user-agent"]) eq 0',
    );
    // detectBot stays first and LIVE.
    assert.equal(rules[0].type, 'BOT');
    assert.equal(rules[0].mode, 'LIVE');
  });
});

describe('enforced hosts (ISS-1728, ISS-1737)', () => {
  const denyingClient = () => clientReturning(denyBots(['CURL']));

  test('default enforcement is the env-derived constant (by reference)', () => {
    const protect = createArcjetProtect(denyingClient());
    assert.equal(protect.enforcement, ARCJET_ENFORCEMENT);
  });

  test('parseHostList: comma list, lower-cased, ports stripped, blanks dropped', () => {
    assert.deepEqual(
      [...parseHostList(' A.example.org , b.example.org:443,, c.example.org.')],
      ['a.example.org', 'b.example.org', 'c.example.org'],
    );
    assert.deepEqual([...parseHostList(' * ')], ['*']);
    assert.equal(parseHostList(undefined).size, 0);
    assert.equal(parseHostList('').size, 0);
  });

  test('enforced host: denied decision is enforced', async () => {
    const protect = createProtect(denyingClient());
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(), PATH, log);

    assert.equal(result.denied, true);
    assert.equal(result.conclusion, 'DENY');
    assert.equal(entries[0].data.enforced, true);
  });

  test('host not listed: denied decision is logged but not enforced', async () => {
    const protect = createProtect(denyingClient());
    const { log, entries } = captureLog();

    const result = await protect(
      makeRequest({ host: 'other.example.org' }),
      PATH,
      log,
    );

    assert.deepEqual(result, {
      denied: false,
      conclusion: 'DENIED_NOT_ENFORCED',
      deniedBots: ['CURL'],
      reasonType: 'BOT',
    });
    assert.equal(entries.length, 1);
    assert.equal(entries[0].event, 'arcjet_denied');
    assert.equal(entries[0].data.enforced, false);
    assert.equal(entries[0].data.host, 'other.example.org');
  });

  test('empty list (kill switch): nothing is enforced', async () => {
    const protect = createArcjetProtect(denyingClient(), {
      enforcement: enforcement(''),
    });
    const { log } = captureLog();
    const result = await protect(makeRequest(), PATH, log);
    assert.equal(result.conclusion, 'DENIED_NOT_ENFORCED');
  });

  const conclusionFor = async (config: ArcjetEnforcement, host: string) => {
    const protect = createArcjetProtect(denyingClient(), {
      enforcement: config,
    });
    const { log } = captureLog();
    return (await protect(makeRequest({ host }), PATH, log)).conclusion;
  };

  test('`*` enforces every host', async () => {
    assert.equal(
      await conclusionFor(enforcement('*'), 'any.example.org'),
      'DENY',
    );
  });

  test('unenforced host wins over `*`', async () => {
    const config = enforcement('*', 'mboa.c211.io');
    assert.equal(
      await conclusionFor(config, 'MBOA.C211.IO:443'),
      'DENIED_NOT_ENFORCED',
    );
    assert.equal(await conclusionFor(config, 'example.org'), 'DENY');
  });

  test('unenforced host wins over the same host in the enforced list', async () => {
    const config = enforcement('example.org', 'example.org');
    assert.equal(
      await conclusionFor(config, 'example.org'),
      'DENIED_NOT_ENFORCED',
    );
  });

  test('`*` in the unenforced list enforces nothing', async () => {
    assert.equal(
      await conclusionFor(enforcement('*', '*'), 'example.org'),
      'DENIED_NOT_ENFORCED',
    );
  });

  test('host match is case-insensitive and ignores a port', async () => {
    const protect = createProtect(denyingClient());
    const { log } = captureLog();
    const result = await protect(
      makeRequest({ host: 'EXAMPLE.ORG:443' }),
      PATH,
      log,
    );
    assert.equal(result.conclusion, 'DENY');
  });

  test('normalizeHost: IPv6 literals, trailing dots and junk', () => {
    assert.equal(normalizeHost('[::1]:3000'), '[::1]');
    assert.equal(normalizeHost('[2001:DB8::1]'), '[2001:db8::1]');
    assert.equal(normalizeHost('Example.org.'), 'example.org');
    assert.equal(normalizeHost('example.org.:443'), 'example.org');
    assert.equal(normalizeHost('  '), '');
    assert.equal(normalizeHost('bad host'), '');
  });

  test('trailing-dot host matches its listed host', async () => {
    assert.equal(
      await conclusionFor(enforcement('example.org'), 'example.org.'),
      'DENY',
    );
  });

  test('IPv6 host matches only its own entry', async () => {
    const config = enforcement('[2001:db8::1]');
    assert.equal(await conclusionFor(config, '[2001:db8::1]:443'), 'DENY');
    assert.equal(
      await conclusionFor(config, '[2001:db8::2]'),
      'DENIED_NOT_ENFORCED',
    );
  });

  test('unparseable host is never enforced by a specific entry', async () => {
    assert.equal(
      await conclusionFor(enforcement('example.org'), 'bad host'),
      'DENIED_NOT_ENFORCED',
    );
  });

  test('x-forwarded-host does not enforce', async () => {
    const protect = createProtect(denyingClient());
    const { log } = captureLog();
    const result = await protect(
      makeRequest({
        host: 'other.example.org',
        'x-forwarded-host': 'example.org',
      }),
      PATH,
      log,
    );
    assert.equal(result.conclusion, 'DENIED_NOT_ENFORCED');
  });
});

describe('MBOA internal traffic (ISS-1734, ISS-1728)', () => {
  const MBOA_PRIVATE_CHAIN =
    '10.44.12.7, 10.215.199.3,13.86.38.95,172.70.35.175';
  const MBOA_HEADERS = {
    host: NO_CLIENT_IP_BYPASS_HOST,
    'x-forwarded-for': MBOA_PRIVATE_CHAIN,
    'do-connecting-ip': MBOA_PROXY_IP,
  };

  function countingClient(decision: ArcjetDecision = denyBots(['CURL'])) {
    let calls = 0;
    let lastOptions: { ipSrc?: string } | undefined;
    return {
      calls: () => calls,
      lastOptions: () => lastOptions,
      client: {
        protect: async (_req: unknown, options?: { ipSrc?: string }) => {
          calls += 1;
          lastOptions = options;
          return decision;
        },
      },
    };
  }

  test('private client via the mn.gov proxy gets a real decision with ipSrc = the hop the proxy appended', async () => {
    const { client, calls, lastOptions } = countingClient(allow());
    const protect = createProtect(client, { sampleHeaderLog: () => true });
    const { log, entries } = captureLog();
    const req = makeRequest({ ...MBOA_HEADERS, cookie: 'session=secret' });

    const result = await protect(req, PATH, log);

    assert.deepEqual(result, { denied: false, conclusion: 'ALLOW' });
    assert.equal(calls(), 1, 'Arcjet protect must be called');
    assert.deepEqual(lastOptions(), { ipSrc: '10.215.199.3' });
    assert.equal(entries.length, 1);
    assert.equal(entries[0].data.ipSrc, '10.215.x.x');
    assert.equal(entries[0].level, 'warn');
    assert.equal(entries[0].event, 'arcjet_no_client_ip');
    assert.equal(entries[0].data.host, NO_CLIENT_IP_BYPASS_HOST);
    assert.equal(entries[0].data.pathName, PATH);
    assert.equal(entries[0].data.doConnectingIp, '13.86.x.x');
    // Every hop is masked the same way, private or public.
    assert.equal(
      entries[0].data.forwardedFor,
      '10.44.x.x, 10.215.x.x, 13.86.x.x, 172.70.x.x',
    );
    const headers = entries[0].data.headers as Record<string, string>;
    assert.equal('cookie' in headers, false);
    assert.equal(
      headers['x-forwarded-for'],
      '10.44.x.x, 10.215.x.x, 13.86.x.x, 172.70.x.x',
    );
  });

  test('bot behind the State network is still detected (logged, not enforced on MBOA)', async () => {
    const { client, lastOptions } = countingClient(denyBots(['CURL']));
    const protect = createArcjetProtect(client);
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(MBOA_HEADERS), PATH, log);

    assert.deepEqual(lastOptions(), { ipSrc: '10.215.199.3' });
    assert.equal(result.conclusion, 'DENIED_NOT_ENFORCED');
    assert.equal(entries.at(-1)?.event, 'arcjet_denied');
  });

  test('via the mn.gov proxy but no usable hop: allowed without calling Arcjet', async () => {
    const { client, calls } = countingClient();
    const protect = createProtect(client);
    const { log, entries } = captureLog();

    const result = await protect(
      makeRequest({ ...MBOA_HEADERS, 'x-forwarded-for': '10.0.0.1' }),
      PATH,
      log,
    );

    assert.deepEqual(result, { denied: false, conclusion: 'NO_CLIENT_IP' });
    assert.equal(calls(), 0);
    assert.equal(entries[0].data.ipSrc, 'none');
  });

  test('sampled-out no-client-ip emits the counter event without headers', async () => {
    const { client } = countingClient(allow());
    const protect = createProtect(client, { sampleHeaderLog: () => false });
    const { log, entries } = captureLog();

    await protect(makeRequest({ ...MBOA_HEADERS, cookie: 'a=b' }), PATH, log);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].event, 'arcjet_no_client_ip_sampled_out');
    assert.equal('headers' in entries[0].data, false);
  });

  test('routable client on MBOA still reaches Arcjet', async () => {
    const { client, calls } = countingClient();
    const protect = createProtect(client);
    const { log } = captureLog();
    await protect(
      makeRequest({ ...MBOA_HEADERS, 'x-forwarded-for': CLIENT_IP }),
      PATH,
      log,
    );
    assert.equal(calls(), 1);
  });

  // Forwarding headers can be spoofed: outside MBOA-via-proxy, a missing
  // or untrusted client IP must never skip the check.
  const mustReachArcjet: Array<[string, Record<string, string>]> = [
    ['no forwarding headers, other host', { 'x-forwarded-for': '' }],
    [
      'private-only XFF from another host',
      {
        'x-forwarded-for': MBOA_PRIVATE_CHAIN,
        'do-connecting-ip': MBOA_PROXY_IP,
      },
    ],
    [
      'spoofed cf-connecting-ip from a non-Cloudflare peer',
      { 'x-forwarded-for': '', 'cf-connecting-ip': '10.0.0.1' },
    ],
    [
      'MBOA host, but not via the mn.gov proxy',
      { ...MBOA_HEADERS, 'do-connecting-ip': '198.51.100.9' },
    ],
    [
      'MBOA host, no do-connecting-ip',
      { host: NO_CLIENT_IP_BYPASS_HOST, 'x-forwarded-for': MBOA_PRIVATE_CHAIN },
    ],
  ];
  for (const [name, headers] of mustReachArcjet) {
    test(`${name}: Arcjet is called, no ipSrc`, async () => {
      const { client, calls, lastOptions } = countingClient();
      const protect = createProtect(client);
      const { log } = captureLog();
      const result = await protect(makeRequest(headers), PATH, log);
      assert.equal(calls(), 1, 'Arcjet protect must be called');
      assert.equal(
        lastOptions(),
        undefined,
        'spoofable chain must not set ipSrc',
      );
      assert.notEqual(result.conclusion, 'NO_CLIENT_IP');
    });
  }
});

describe('fingerprint failure logging (ISS-1734)', () => {
  test('thrown SDK error fails open and logs redacted headers', async () => {
    const protect = createProtect(
      {
        protect: async () => {
          throw new TypeError(FINGERPRINT_ERROR);
        },
      },
      { sampleHeaderLog: () => true },
    );
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(SENSITIVE_HEADERS), PATH, log);

    assert.deepEqual(result, { denied: false, conclusion: 'THREW' });
    assert.equal(entries.length, 1);
    const entry = entries[0];
    assert.equal(entry.level, 'warn');
    assert.equal(entry.event, 'arcjet_fingerprint_failed');
    assert.equal(entry.data.conclusion, 'THREW');
    assert.equal(entry.data.errorType, 'TypeError');
    assert.equal(entry.data.message, FINGERPRINT_ERROR);
    assert.equal(entry.data.host, 'example.org');
    assert.equal(entry.data.pathName, PATH);

    const headers = entry.data.headers as Record<string, string>;
    assert.equal('cookie' in headers, false);
    assert.equal('authorization' in headers, false);
    assert.equal('referer' in headers, false);
    assert.equal('x-custom-header' in headers, false);
    assert.equal(headers['x-forwarded-for'], '8.8.x.x, 10.0.x.x');
    assert.equal(headers['do-connecting-ip'], '198.51.x.x');
    assert.equal(headers['cf-connecting-ip'], '192.0.x.x');
    assert.equal(headers['x-real-ip'], '2001:db8:x');
    assert.equal(headers['user-agent'], 'TestAgent/1.0');
    assert.equal(headers.host, 'example.org');
    assert.equal(JSON.stringify(entry).includes('secret'), false);
  });

  test('ERROR conclusion fails open and logs the SDK error message', async () => {
    const protect = createProtect(clientReturning(errored()), {
      sampleHeaderLog: () => true,
    });
    const { log, entries } = captureLog();

    const result = await protect(makeRequest(SENSITIVE_HEADERS), PATH, log);

    assert.deepEqual(result, { denied: false, conclusion: 'ERROR' });
    assert.equal(entries[0].event, 'arcjet_fingerprint_failed');
    assert.equal(entries[0].data.conclusion, 'ERROR');
    assert.equal(entries[0].data.errorType, 'ERROR');
    assert.equal(entries[0].data.message, FINGERPRINT_ERROR);
    assert.ok(entries[0].data.headers);
  });

  test('sampled-out failures log a counter event without headers', async () => {
    const protect = createProtect(clientReturning(errored()), {
      sampleHeaderLog: () => false,
    });
    const { log, entries } = captureLog();

    await protect(makeRequest(SENSITIVE_HEADERS), PATH, log);

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
    const protect = createProtect(clientReturning(errored()), {
      sampleHeaderLog: sampler,
    });
    const { log, entries } = captureLog();

    for (let i = 0; i < FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE + 10; i++) {
      await protect(makeRequest(), PATH, log);
    }
    const withHeaders = entries.filter(
      (e) => e.event === 'arcjet_fingerprint_failed',
    );
    assert.equal(withHeaders.length, FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE);
    assert.equal(entries.length, FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE + 10);

    now += 60_000;
    await protect(makeRequest(), PATH, log);
    assert.equal(entries.at(-1)?.event, 'arcjet_fingerprint_failed');
  });
});

describe('Arcjet API circuit breaker', () => {
  const TIMEOUT = '[deadline_exceeded] the operation timed out';
  const timedOut = () =>
    new ArcjetErrorDecision({
      ttl: 0,
      results: [],
      reason: new ArcjetErrorReason(TIMEOUT),
    });

  /** A client that answers from `next` and counts its calls. */
  function scriptedClient() {
    const state = { calls: 0, next: timedOut() as ArcjetDecision };
    return {
      state,
      client: {
        protect: async () => {
          state.calls += 1;
          return state.next;
        },
      },
    };
  }

  function setupBreaker(openMs = 60_000) {
    let now = 1_000_000;
    const breaker = createCircuitBreaker({
      failureThreshold: ARCJET_CIRCUIT_FAILURE_THRESHOLD,
      openMs,
      now: () => now,
    });
    return { breaker, advance: (ms: number) => (now += ms) };
  }

  test('consecutive API timeouts bypass Arcjet without calling it', async () => {
    const { client, state } = scriptedClient();
    const { breaker } = setupBreaker();
    const protect = createProtect(client, {
      breaker,
      sampleHeaderLog: () => false,
    });
    const { log, entries } = captureLog();

    for (let i = 0; i < ARCJET_CIRCUIT_FAILURE_THRESHOLD; i++) {
      const result = await protect(makeRequest(), PATH, log);
      assert.equal(result.conclusion, 'ERROR');
    }
    const open = entries.filter((e) => e.event === 'arcjet_circuit_open');
    assert.equal(open.length, 1);
    assert.equal(open[0].data.reopened, false);

    const bypassed = await protect(makeRequest(), PATH, log);
    assert.deepEqual(bypassed, { denied: false, conclusion: 'BYPASSED' });
    assert.equal(state.calls, ARCJET_CIRCUIT_FAILURE_THRESHOLD);
  });

  test('a successful probe after openMs closes the circuit', async () => {
    const { client, state } = scriptedClient();
    const { breaker, advance } = setupBreaker(60_000);
    const protect = createProtect(client, {
      breaker,
      sampleHeaderLog: () => false,
    });
    const { log, entries } = captureLog();

    for (let i = 0; i < ARCJET_CIRCUIT_FAILURE_THRESHOLD; i++) {
      await protect(makeRequest(), PATH, log);
    }
    await protect(makeRequest(), PATH, log); // bypassed
    advance(60_000);
    state.next = allow();

    const probe = await protect(makeRequest(), PATH, log);
    assert.equal(probe.conclusion, 'ALLOW');
    const closed = entries.find((e) => e.event === 'arcjet_circuit_closed');
    assert.equal(closed?.data.skipped, 1);
    assert.equal(breaker.state, 'closed');
  });

  test('local SDK errors and thrown non-API errors do not open the circuit', async () => {
    const { breaker } = setupBreaker();
    const protect = createProtect(clientReturning(errored()), {
      breaker,
      sampleHeaderLog: () => false,
    });
    const { log } = captureLog();

    for (let i = 0; i < ARCJET_CIRCUIT_FAILURE_THRESHOLD * 2; i++) {
      await protect(makeRequest(), PATH, log);
    }
    assert.equal(breaker.state, 'closed');
  });

  test('a thrown unavailable error counts as an API failure', async () => {
    const { breaker } = setupBreaker();
    const protect = createProtect(
      {
        protect: async () => {
          throw new Error('[unavailable] connection recycled');
        },
      },
      { breaker, sampleHeaderLog: () => false },
    );
    const { log } = captureLog();

    for (let i = 0; i < ARCJET_CIRCUIT_FAILURE_THRESHOLD; i++) {
      assert.equal(
        (await protect(makeRequest(), PATH, log)).conclusion,
        'THREW',
      );
    }
    assert.equal(breaker.state, 'open');
  });

  test('isArcjetUnavailableError matches only API timeouts and unavailability', () => {
    assert.equal(isArcjetUnavailableError(TIMEOUT), true);
    assert.equal(
      isArcjetUnavailableError(
        '[unavailable] connection recycled after consecutive deadline failures',
      ),
      true,
    );
    assert.equal(isArcjetUnavailableError(FINGERPRINT_ERROR), false);
    assert.equal(isArcjetUnavailableError('[internal] boom'), false);
  });
});

describe('helpers', () => {
  test('maskIp masks every address to two octets / groups', () => {
    assert.equal(maskIp('8.8.8.8'), '8.8.x.x');
    assert.equal(maskIp(' 10.1.2.3 '), '10.1.x.x');
    assert.equal(maskIp('192.168.1.1'), '192.168.x.x');
    assert.equal(maskIp('2001:db8::1'), '2001:db8:x');
    assert.equal(maskIp('fe80::1'), 'fe80:0:x');
    assert.equal(maskIp('::1'), '0:0:x');
    assert.equal(maskIp(''), '');
  });

  test('maskIp strips a port before masking', () => {
    assert.equal(maskIp('8.8.8.8:51234'), '8.8.x.x');
    assert.equal(maskIp('[2001:db8::1]:443'), '2001:db8:x');
    assert.equal(maskIp('[2001:db8::1]'), '2001:db8:x');
  });

  test('maskIp handles short IPv6 groups and IPv4-mapped addresses', () => {
    assert.equal(maskIp('fc::1'), 'fc:0:x');
    assert.equal(maskIp('fe8::1'), 'fe8:0:x');
    assert.equal(maskIp('0:0::1'), '0:0:x');
    assert.equal(maskIp('::ffff:10.0.0.1'), '10.0.x.x');
    assert.equal(maskIp('::FFFF:8.8.8.8'), '8.8.x.x');
    assert.equal(maskIp('[::ffff:8.8.8.8]:443'), '8.8.x.x');
  });

  test('maskIp fully masks malformed input', () => {
    for (const bad of [
      '10.999.0.0',
      '1e1',
      '1.2.3',
      'unknown',
      '::ffff:999.1.1.1',
      'a:b:c:d:e:f:1:2:3',
      '12345::1',
    ]) {
      assert.equal(maskIp(bad), 'x', bad);
    }
  });

  test('redactHeaders keeps only allowlisted headers, IPs masked', () => {
    const headers = new Headers({
      host: 'example.org',
      'user-agent': 'UA',
      accept: 'text/html',
      'accept-language': 'es',
      via: '1.1 proxy',
      'x-forwarded-for': '8.8.8.8, 10.215.199.3:8080',
      'x-rdwr-ip': '192.168.5.5',
      referer: 'https://example.org/en/search?q=food',
      'set-cookie': 'a=b',
      'x-id': '1',
    });
    assert.deepEqual(redactHeaders(headers), {
      host: 'example.org',
      'user-agent': 'UA',
      accept: 'text/html',
      'accept-language': 'es',
      via: '1.1 proxy',
      'x-forwarded-for': '8.8.x.x, 10.215.x.x',
      'x-rdwr-ip': '192.168.x.x',
    });
  });

  test('internalIpSrc returns the entry left of the last mn.gov proxy hop', () => {
    assert.equal(
      internalIpSrc(
        `10.44.12.7, 10.215.199.3,${MBOA_PROXY_IP},${CLOUDFLARE_IP}`,
      ),
      '10.215.199.3',
    );
    assert.equal(internalIpSrc(`10.0.0.1, ${MBOA_PROXY_IP}`), '10.0.0.1');
    assert.equal(
      internalIpSrc(`${MBOA_PROXY_IP}, ${CLOUDFLARE_IP}`),
      undefined,
    );
    assert.equal(internalIpSrc('10.0.0.1, 10.0.0.2'), undefined);
    assert.equal(internalIpSrc(`garbage, ${MBOA_PROXY_IP}`), undefined);
    assert.equal(internalIpSrc(`, ${MBOA_PROXY_IP}`), undefined);
    assert.equal(internalIpSrc(null), undefined);
  });

  test('resolveArcjetClientIp walks past trusted proxies and private hops', () => {
    const req = makeRequest({
      'x-forwarded-for': `${CLIENT_IP}, 10.215.199.3,${MBOA_PROXY_IP},${CLOUDFLARE_IP}`,
    });
    assert.equal(resolveArcjetClientIp(req), CLIENT_IP);
  });

  test('resolveArcjetClientIp returns empty with no usable header', () => {
    const bare = new NextRequest('https://example.org/en', {
      headers: { host: 'example.org' },
    });
    assert.equal(resolveArcjetClientIp(bare), '');
  });

  test('parseTimeoutMs: positive integer from env, else 500 ms', () => {
    assert.equal(ARCJET_DEFAULT_TIMEOUT_MS, 500);
    assert.equal(parseTimeoutMs('750'), 750);
    for (const bad of [undefined, '', '0', '-5', '1.5', 'abc']) {
      assert.equal(parseTimeoutMs(bad), 500, String(bad));
    }
  });
});
