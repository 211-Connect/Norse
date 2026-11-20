// Demo only: the "what the v2 call returned" box is hidden unless the demo flag is on.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { demoPeekEnabled } from '../src/app/(app)/features/search/v2/demo-flag';

test('demoPeekEnabled: on only for the exact value "true"', () => {
  assert.equal(demoPeekEnabled('true'), true);
});

test('demoPeekEnabled: unset or any other value is off', () => {
  assert.equal(demoPeekEnabled(undefined), false);
  assert.equal(demoPeekEnabled(''), false);
  assert.equal(demoPeekEnabled('false'), false);
  assert.equal(demoPeekEnabled('1'), false);
});
