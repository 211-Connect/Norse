import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renameLocalFavoriteIds } from '../src/app/(app)/shared/lib/localFavoriteRenames';

/**
 * Anonymous favorites live only in the visitor's browser, so after a re-key
 * the server cannot rewrite them (ISS-2516). The batch lookup returns the
 * re-keyed record under the OLD id it was asked for; Norse then has to
 * rename the stored id, or `isLocalFavorite(resource.id)` filters the record
 * out of the list. `resolved` is requested id -> the record's current id.
 */

test('an old id is renamed to the id its record has now, in place', () => {
  assert.deepEqual(
    renameLocalFavoriteIds(['old-a', 'kept'], {
      'old-a': 'new-a',
      kept: 'kept',
    }),
    ['new-a', 'kept'],
  );
});

test('nothing renamed -> null, so storage is not rewritten', () => {
  assert.equal(
    renameLocalFavoriteIds(['kept', 'missing'], { kept: 'kept' }),
    null,
  );
});

test('an id the lookup could not find is kept, not dropped', () => {
  assert.deepEqual(
    renameLocalFavoriteIds(['old-a', 'missing'], { 'old-a': 'new-a' }),
    ['new-a', 'missing'],
  );
});

test('an old id whose new id is already saved collapses to one entry', () => {
  assert.deepEqual(
    renameLocalFavoriteIds(['new-a', 'old-a'], {
      'new-a': 'new-a',
      'old-a': 'new-a',
    }),
    ['new-a'],
  );
});
