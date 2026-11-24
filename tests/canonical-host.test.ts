import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { bareHost, tenantCanonicalHost } from '../src/utils/canonicalHost';

describe('tenantCanonicalHost', () => {
  test('the first trusted domain, as a bare host', () => {
    assert.equal(
      tenantCanonicalHost({
        trustedDomains: [
          { domain: 'https://Search.WA211.org/' },
          { domain: 'wa211.norse.app' },
        ],
      }),
      'search.wa211.org',
    );
    assert.equal(tenantCanonicalHost({ trustedDomains: [] }), null);
    assert.equal(tenantCanonicalHost(null), null);
  });
});

describe('bareHost', () => {
  test('drops scheme, path and port', () => {
    assert.equal(
      bareHost('https://Search.Example.org:443/x?y'),
      'search.example.org',
    );
  });
});
