import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  canonicalHostProblem,
  tenantCanonicalHost,
} from '../src/utils/canonicalHost';

const trustedDomains = [
  { domain: 'search.wa211.org' },
  { domain: 'wa211.norse.app' },
];

describe('tenantCanonicalHost', () => {
  test('the explicit canonical host, else the first trusted domain', () => {
    assert.equal(
      tenantCanonicalHost({
        seo: { canonicalHost: 'wa211.norse.app' },
        trustedDomains,
      }),
      'wa211.norse.app',
    );
    assert.equal(
      tenantCanonicalHost({ seo: { canonicalHost: '' }, trustedDomains }),
      'search.wa211.org',
    );
    assert.equal(tenantCanonicalHost({ trustedDomains: [] }), null);
    assert.equal(tenantCanonicalHost(null), null);
  });
});

describe('canonicalHostProblem', () => {
  test('empty is fine', () => {
    assert.equal(canonicalHostProblem('', trustedDomains), null);
    assert.equal(canonicalHostProblem(null, trustedDomains), null);
  });

  test('must be a bare host', () => {
    assert.match(
      canonicalHostProblem('https://search.wa211.org/', trustedDomains) ?? '',
      /host only/,
    );
    assert.match(
      canonicalHostProblem('Search.WA211.org', trustedDomains) ?? '',
      /host only/,
    );
  });

  test('must be one of the trusted domains', () => {
    assert.equal(canonicalHostProblem('wa211.norse.app', trustedDomains), null);
    assert.match(
      canonicalHostProblem('example.org', trustedDomains) ?? '',
      /trusted domains/,
    );
  });
});
