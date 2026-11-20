import assert from 'node:assert/strict';
import test from 'node:test';

import { heroImageSrc } from '../src/app/(app)/features/home/utils/hero-image';

test('heroImageSrc returns the trimmed url', () => {
  assert.equal(heroImageSrc(' https://x/y.jpg '), 'https://x/y.jpg');
});

test('heroImageSrc is null for empty, blank or missing values', () => {
  for (const v of [undefined, null, '', '   '])
    assert.equal(heroImageSrc(v), null);
});
