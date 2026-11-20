// UX round 2026-11-20: location step, Enter before load, Everywhere order, fixed header and bottom bar,
// loading hides the bar, results page fits the viewport, Quick exit color.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { listMiddlewareNames } from '../src/app/(app)/shared/components/ui/autocomplete/placement';

const SRC = new URL('../src/app/(app)/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, SRC), 'utf8');

const GUIDE = 'shared/components/search/search-guide.tsx';
const LANDING_LOCATION = 'features/search/components/landing-location.tsx';

// ---- A. Location step ----

test('A: the "greatly improves" line is gone and the sentence shows only when a location is required', () => {
  const src = read(GUIDE);
  assert.doesNotMatch(src, /greatly improves/);
  assert.match(src, /requireLocation && \(\s*<p>/);
});

test('A: both v2 call sites ask for an inline button, an input-anchored list and a light gray border', () => {
  for (const file of [GUIDE, LANDING_LOCATION]) {
    const src = read(file);
    assert.match(src, /myLocationInline/, file);
    assert.match(src, /anchorList="input"/, file);
    assert.match(src, /listClassName="[^"]*border-gray-300/, file);
  }
});

test('A: the location bar and the button take the new opt-in props', () => {
  const bar = read('shared/components/search/location-search-bar.tsx');
  assert.match(bar, /myLocationInline\?: boolean/);
  assert.match(bar, /anchorList\?: 'form' \| 'input'/);
  assert.doesNotMatch(bar, /flipped above|flips above|flipped above/);
  const button = read('shared/components/search/use-my-location-button.tsx');
  assert.match(button, /className\?: string/);
});

test('A: placement "below" has no flip middleware, "auto" keeps it', () => {
  assert.deepEqual(listMiddlewareNames('auto'), ['offset', 'flip', 'shift', 'size']);
  assert.deepEqual(listMiddlewareNames('below'), ['offset', 'shift', 'size']);
  const src = read('shared/components/ui/autocomplete/autocomplete.tsx');
  assert.match(src, /listMiddlewareNames\(placement\)/);
});
