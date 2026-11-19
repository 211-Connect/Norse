import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getCmsAdminRedirectUrl } from '../src/lib/cms/admin-redirect';

const CMS = 'https://cms.example.org';

describe('getCmsAdminRedirectUrl', () => {
  test('is null without a CMS URL', () => {
    assert.equal(getCmsAdminRedirectUrl(undefined), null);
    assert.equal(getCmsAdminRedirectUrl(''), null);
  });

  test('goes to the admin root', () => {
    assert.equal(getCmsAdminRedirectUrl(CMS), `${CMS}/admin`);
    assert.equal(getCmsAdminRedirectUrl(`${CMS}/`), `${CMS}/admin`);
  });

  test('keeps the base path, page and query', () => {
    assert.equal(
      getCmsAdminRedirectUrl(
        `${CMS}/adresources`,
        ['collections', 'users'],
        '?limit=10',
      ),
      `${CMS}/adresources/admin/collections/users?limit=10`,
    );
  });

  test('cannot leave the CMS host', () => {
    assert.equal(
      getCmsAdminRedirectUrl(CMS, ['/evil.example', '@evil']),
      `${CMS}/admin/%2Fevil.example/%40evil`,
    );
    assert.equal(
      new URL(getCmsAdminRedirectUrl(CMS, ['..', '..', 'evil']) ?? '').origin,
      CMS,
    );
  });
});
