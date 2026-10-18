// Cut-over scaffolding (ISS-2372): deleted by ISS-2377.
//
// The live runner against local stand-in sites, never a live tenant: what it records, that it contacts no
// other origin (a tracker server counts the hits it gets), that a page it cannot load is "could not verify"
// and never a pass, and that a broken build is reported as a behaviour change for exactly the URLs it breaks.
// Needs Playwright's Chromium: `npx playwright install chromium`.
//
//   node --import tsx --test tests/search-intent-cutover/live/live.test.ts
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';

import type { Browser } from '@playwright/test';

import { TENANT_FIXTURES } from '../../../e2e/fixtures/tenants';
import {
  compareVisits,
  exitCodeFor,
  type Verdict,
  type Visit,
} from './compare';
import { launchBrowser, observe, RUNNER_USER_AGENT } from './observe';
import { liveUrl, sampleForTenant, type CorpusRow } from './sample';

let tracker: Server;
let trackerHits = 0;
let trackerOrigin = '';
const userAgents: string[] = [];

function page(title: string, body: string) {
  return `<!doctype html><html><head><title>${title}</title>
<script src="${trackerOrigin}/script.js"></script></head>
<body>${body}<img src="${trackerOrigin}/pixel.gif"></body></html>`;
}

const RESULTS = `<div id="search-container"><span id="result-total">12 results</span>
<a data-testid="resource-link" href="/search/r1">One</a>
<a data-testid="resource-link" href="/search/r2">Two</a>
<div role="alert">Synthetic notify alert</div></div>`;

/** A stand-in tenant site. `broken` stops the redirect, as a build whose gate stopped redirecting would. */
function site({ broken = false } = {}): Server {
  return createServer((req, res) => {
    userAgents.push(req.headers['user-agent'] ?? '');
    const path = req.url ?? '/';
    if (path === '/redirect' && !broken) {
      res.writeHead(307, { location: '/search?query=a' }).end();
    } else if (path === '/boom') {
      res.writeHead(500).end('error');
    } else if (path === '/slow') {
      // never answers
    } else if (path === '/clarify') {
      res.writeHead(200, { 'content-type': 'text/html' }).end(
        page(
          'Clarify',
          `<div id="search-container"><div data-testid="ai-classification-options">
<button aria-pressed="true">Food pantries</button><button aria-pressed="false">Meals</button></div></div>`,
        ),
      );
    } else {
      res
        .writeHead(200, { 'content-type': 'text/html' })
        .end(page('Results', RESULTS));
    }
  });
}

const listen = (server: Server) =>
  new Promise<string>((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`),
    ),
  );

let browser: Browser;
let siteA: Server;
let siteB: Server;
let originA = '';
let originB = '';

before(async () => {
  tracker = createServer((_req, res) => {
    trackerHits++;
    res.writeHead(200).end('');
  });
  await new Promise<void>((resolve) => tracker.listen(0, '127.0.0.1', resolve));
  // `localhost` is a different origin from `127.0.0.1`, as a tracker's host is from a tenant's.
  trackerOrigin = `http://localhost:${(tracker.address() as AddressInfo).port}`;
  siteA = site();
  siteB = site({ broken: true });
  originA = await listen(siteA);
  originB = await listen(siteB);
  browser = await launchBrowser();
});

after(async () => {
  await browser?.close();
  for (const s of [tracker, siteA, siteB]) s?.closeAllConnections?.();
  for (const s of [tracker, siteA, siteB]) s?.close();
});

test('records the redirect chain, final URL, title, results and alert, and contacts no other origin', async () => {
  const hitsBefore = trackerHits;
  const visit = await observe(browser, `${originA}/redirect`, {
    timeoutMs: 10_000,
  });
  assert.ok(visit.ok, visit.ok ? '' : visit.reason);
  assert.deepStrictEqual(visit.observation, {
    chain: [
      { url: '/redirect', status: 307 },
      { url: '/search?query=a', status: 200 },
    ],
    finalUrl: '/search?query=a',
    title: 'Results',
    resultTotal: '12 results',
    resultIds: ['/search/r1', '/search/r2'],
    clarify: { open: false, options: [] },
    alert: 'Synthetic notify alert',
    blockedHosts: [new URL(trackerOrigin).host],
  });
  assert.equal(trackerHits, hitsBefore, 'the tracker was contacted');
  assert.ok(
    userAgents.length > 0 && userAgents.every((ua) => ua === RUNNER_USER_AGENT),
  );
});

test('records an open clarify dialog and its options', async () => {
  const visit = await observe(browser, `${originA}/clarify`, {
    timeoutMs: 10_000,
  });
  assert.ok(visit.ok);
  assert.deepStrictEqual(visit.observation.clarify, {
    open: true,
    options: ['Food pantries [selected]', 'Meals'],
  });
});

test('a server error or a timeout is "could not verify", never a pass', async () => {
  const boom = await observe(browser, `${originA}/boom`, { timeoutMs: 10_000 });
  const slow = await observe(browser, `${originA}/slow`, { timeoutMs: 1_500 });
  assert.deepStrictEqual(boom, { ok: false, reason: 'HTTP 500' });
  assert.equal(slow.ok, false);
  const ok = await observe(browser, `${originA}/search?query=a`, {
    timeoutMs: 10_000,
  });
  for (const failed of [boom, slow]) {
    assert.equal(compareVisits(ok, failed).kind, 'could_not_verify');
    assert.equal(compareVisits(failed, ok).kind, 'could_not_verify');
  }
  assert.equal(exitCodeFor([{ kind: 'pass' }, compareVisits(ok, boom)]), 2);
  assert.equal(exitCodeFor([]), 2, 'nothing compared is not a pass');
});

test('a broken build is a behaviour change for exactly the URLs it breaks', async () => {
  const paths = ['/redirect', '/clarify', '/search?query=a'];
  const verdicts: Verdict[] = [];
  for (const path of paths) {
    const a = await observe(browser, `${originA}${path}`, {
      timeoutMs: 10_000,
    });
    const b = await observe(browser, `${originB}${path}`, {
      timeoutMs: 10_000,
    });
    verdicts.push(compareVisits(a, b));
  }
  assert.deepStrictEqual(verdicts, [
    { kind: 'behaviour', fields: ['chain', 'finalUrl'] },
    { kind: 'pass' },
    { kind: 'pass' },
  ]);
  assert.equal(exitCodeFor(verdicts), 1);
});

test('different results alone are data drift, not a behaviour change', () => {
  const visit = (ids: string[]): Visit => ({
    ok: true,
    observation: {
      chain: [{ url: '/search', status: 200 }],
      finalUrl: '/search',
      title: 'Results',
      resultTotal: `${ids.length} results`,
      resultIds: ids,
      clarify: { open: false, options: [] },
      alert: null,
      blockedHosts: [],
    },
  });
  const verdict = compareVisits(
    visit(['/search/r1']),
    visit(['/search/r2', '/search/r3']),
  );
  assert.deepStrictEqual(verdict, {
    kind: 'data',
    fields: ['resultTotal', 'resultIds'],
  });
  assert.equal(exitCodeFor([verdict]), 0);
});

test('the sample is capped, covers every generation the tenant has, and is deterministic', () => {
  const row = (
    scenario: string,
    generation: string,
    views: number,
    tenant = 'WA-prod',
  ): CorpusRow => ({
    scenario,
    tenant,
    generation,
    views_in_scenario: views,
    path: '/search',
    query: `query=${scenario}`,
  });
  const rows = [
    ...Array.from({ length: 30 }, (_, i) =>
      row(`c${i}`, 'classic_text', 100 - i),
    ),
    ...Array.from({ length: 30 }, (_, i) =>
      row(`t${i}`, 'taxonomy_card', 100 - i),
    ),
    row('o1', 'organization_link', 1),
    row('x1', 'classic_text', 1000, 'AZ-prod'),
  ];
  const sample = sampleForTenant(rows, 'WA', 50);
  assert.equal(sample.length, 50);
  assert.deepStrictEqual([...new Set(sample.map((r) => r.generation))].sort(), [
    'classic_text',
    'organization_link',
    'taxonomy_card',
  ]);
  assert.ok(sample.every((r) => r.tenant === 'WA-prod'));
  assert.equal(sample[0].scenario, 'c0', 'most-viewed first');
  assert.deepStrictEqual(sampleForTenant(rows, 'WA', 50), sample);
  assert.equal(
    liveUrl(TENANT_FIXTURES.MBOA.baseUrl.prod, {
      ...row('m', 'classic_text', 1, 'MBOA-prod'),
      path: '/adresources/search/',
    }),
    'https://mn.gov/adresources/search/?query=m',
  );
});
