// Prototype: when the floating "Not getting the results you expected?" control hides (D1).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { helpControlHidden } from '../src/app/(app)/features/search/v2/help-visibility';

const onScreen = { top: 100, bottom: 300 };

test('helpControlHidden: fewer than 4 results hides it', () => {
  assert.equal(
    helpControlHidden({
      resultCount: 3,
      refineRect: null,
      viewportHeight: 800,
    }),
    true,
  );
  assert.equal(
    helpControlHidden({
      resultCount: 0,
      refineRect: null,
      viewportHeight: 800,
    }),
    true,
  );
});

test('helpControlHidden: the refine card on screen hides it', () => {
  assert.equal(
    helpControlHidden({
      resultCount: 10,
      refineRect: onScreen,
      viewportHeight: 800,
    }),
    true,
  );
});

test('helpControlHidden: the card scrolled away, or absent, shows it', () => {
  assert.equal(
    helpControlHidden({
      resultCount: 4,
      refineRect: { top: -400, bottom: -10 },
      viewportHeight: 800,
    }),
    false,
  );
  assert.equal(
    helpControlHidden({
      resultCount: 4,
      refineRect: { top: 900, bottom: 1100 },
      viewportHeight: 800,
    }),
    false,
  );
  assert.equal(
    helpControlHidden({
      resultCount: 4,
      refineRect: null,
      viewportHeight: 800,
    }),
    false,
  );
});
