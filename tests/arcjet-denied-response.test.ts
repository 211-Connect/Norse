import { NextRequest } from 'next/server';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  ARCJET_DENIED_JSON,
  createArcjetDeniedResponse,
} from '../src/lib/arcjet-denied-response';

const URL = 'https://connect211.com';

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('https://example.org/en/search?q=food', {
    headers: { host: 'example.org', ...headers },
  });
}

function assertCommonHeaders(res: Response, contentType: string) {
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-robots-tag'), 'noindex');
  assert.equal(res.headers.get('content-type'), contentType);
}

function assertNoContactDetails(body: string) {
  assert.equal(body.includes('@'), false, 'body must not contain "@"');
  assert.equal(/mailto/i.test(body), false, 'body must not contain "mailto"');
}

describe('createArcjetDeniedResponse (ISS-1728)', () => {
  test('serves the HTML variant by default with status 403', async () => {
    const res = createArcjetDeniedResponse(makeRequest());
    const body = await res.text();

    assert.equal(res.status, 403);
    assertCommonHeaders(res, 'text/html; charset=utf-8');
    assert.ok(body.includes('<h1>A note from Connect211</h1>'));
    assert.ok(body.includes('What to do next'));
    assert.equal(/<script|<img/i.test(body), false);
    assert.equal((body.match(/<ul>/g) ?? []).length, 2);
    // Each product is its own block: the HSDA line is a <p>, not a bullet.
    assert.ok(
      body.includes(
        '<p><strong>HSDA (Human Services Data API)</strong> — performant data replication in the open HSDS standard.</p>',
      ),
    );
    const lis = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    assert.equal(lis.length, 5);
    assert.ok(
      lis.every((li) => !li.includes('HSDA (Human Services Data API)')),
    );
    // Only link is connect211.com.
    const hrefs = [...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hrefs.length > 0);
    assert.ok(hrefs.every((h) => h === URL));
    assertNoContactDetails(body);
  });

  test('serves HTML when Accept lists both text/html and application/json', async () => {
    const res = createArcjetDeniedResponse(
      makeRequest({ accept: 'text/html, application/json;q=0.9' }),
    );
    assert.equal(res.status, 403);
    assertCommonHeaders(res, 'text/html; charset=utf-8');
  });

  test('serves the JSON variant for Accept: application/json', async () => {
    const res = createArcjetDeniedResponse(
      makeRequest({ accept: 'application/json' }),
    );
    const body = await res.text();
    const parsed = JSON.parse(body);

    assert.equal(res.status, 403);
    assertCommonHeaders(res, 'application/json; charset=utf-8');
    assert.equal(parsed.status, 403);
    assert.equal(parsed.code, 'programmatic_access_via_connect211');
    assert.equal(parsed.url, URL);
    assert.deepEqual(parsed.products, ['Norse API', 'HSDA']);
    assert.equal(parsed.action, 'visit');
    assert.deepEqual(parsed, ARCJET_DENIED_JSON);
    assertNoContactDetails(body);
  });

  test('is independent of the host', async () => {
    const a = await createArcjetDeniedResponse(
      makeRequest({ host: 'a.example' }),
    ).text();
    const b = await createArcjetDeniedResponse(
      makeRequest({ host: 'b.example' }),
    ).text();
    assert.equal(a, b);
  });
});
