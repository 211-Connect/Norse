import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getNorseRole, runsPayload, servesPath } from '../src/lib/norse-role';

describe('getNorseRole', () => {
  test('defaults to all', () => {
    assert.equal(getNorseRole(undefined), 'all');
    assert.equal(getNorseRole(''), 'all');
  });

  test('accepts app and cms', () => {
    assert.equal(getNorseRole('app'), 'app');
    assert.equal(getNorseRole('cms'), 'cms');
  });

  test('rejects anything else', () => {
    assert.throws(() => getNorseRole('payload'), /NORSE_ROLE must be one of/);
  });
});

describe('runsPayload', () => {
  test('only the public app does not run Payload', () => {
    assert.equal(runsPayload('app'), false);
    assert.equal(runsPayload('cms'), true);
    assert.equal(runsPayload('all'), true);
  });
});

describe('servesPath', () => {
  const publicPages = [
    '/',
    '/en',
    '/en/search',
    '/es/search/abc',
    '/auth/signin',
  ];
  const appApi = [
    '/api/auth/session',
    '/api/cms-admin-redirect/collections',
    '/api/share/t1',
    '/api/resource-titles',
    '/api/search-config/t1/en',
    '/api/webhook',
  ];
  const cmsPaths = [
    '/admin',
    '/admin/collections/tenants',
    '/api/users/me',
    '/api/getTenantBasicConfig',
    '/api/tenants/t1/config',
    '/api/internal/printable-directory-pdf',
  ];
  const shared = [
    '/api/health',
    '/api/healthz',
    '/api/metrics',
    '/api/keycloak/domain-check',
  ];

  test('all serves everything', () => {
    for (const path of [...publicPages, ...appApi, ...cmsPaths, ...shared]) {
      assert.equal(servesPath('all', path), true, path);
    }
  });

  test('app serves public pages and its own API, not the CMS', () => {
    for (const path of [...publicPages, ...appApi, ...shared]) {
      assert.equal(servesPath('app', path), true, path);
    }
    for (const path of cmsPaths) {
      assert.equal(servesPath('app', path), false, path);
    }
  });

  test('cms serves the admin and its API, not public pages', () => {
    for (const path of [...cmsPaths, ...shared]) {
      assert.equal(servesPath('cms', path), true, path);
    }
    for (const path of [...publicPages, ...appApi]) {
      assert.equal(servesPath('cms', path), false, path);
    }
  });

  test('prefixes match whole segments', () => {
    assert.equal(servesPath('app', '/administration'), true);
    assert.equal(servesPath('cms', '/api/authors'), true);
  });
});

describe('getNorseRole with a target build', () => {
  test('a target build is its role', () => {
    assert.equal(getNorseRole(undefined, 'app'), 'app');
    assert.equal(getNorseRole(undefined, 'cms'), 'cms');
    assert.equal(getNorseRole('app', 'app'), 'app');
  });

  test('a mismatched NORSE_ROLE throws', () => {
    assert.throws(
      () => getNorseRole('cms', 'app'),
      /built for NORSE_BUILD=app/,
    );
    assert.throws(
      () => getNorseRole('all', 'cms'),
      /built for NORSE_BUILD=cms/,
    );
  });

  test('an all build follows NORSE_ROLE', () => {
    assert.equal(getNorseRole('cms', 'all'), 'cms');
    assert.equal(getNorseRole(undefined, 'all'), 'all');
  });
});
