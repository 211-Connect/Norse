import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { searchSurfacePayload } from '../src/app/(app)/shared/lib/analytics';

describe('Umami search surface', () => {
  test('a landing page reports its id; /search does not', () => {
    assert.deepEqual(searchSurfacePayload('1201', 'es'), {
      surface: 'landing',
      landingPageId: '1201',
      locale: 'es',
    });
    assert.deepEqual(searchSurfacePayload(null, 'en'), {
      surface: 'search',
      locale: 'en',
    });
  });
});
