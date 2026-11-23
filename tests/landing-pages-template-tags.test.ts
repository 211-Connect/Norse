import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  maskTemplateTags,
  unmaskTemplateTags,
} from '../src/app/(app)/features/landing-pages/lib/templateTags';

test('tags are masked and restored in their translated positions', () => {
  const masked = maskTemplateTags('{topic} in {location} | {name}');
  assert.equal(masked.text, '@@__T0__@@ in @@__T1__@@ | @@__T2__@@');
  assert.equal(
    unmaskTemplateTags('@@__T0__@@ en @@__T1__@@ | @@__T2__@@', masked.tags),
    '{topic} en {location} | {name}',
  );
});

test('a reordered translation keeps each tag in its new place', () => {
  const { tags } = maskTemplateTags('Food help in {location}: {topic}');
  assert.equal(
    unmaskTemplateTags('@@__T1__@@ — @@__T0__@@ で食料支援', tags),
    '{topic} — {location} で食料支援',
  );
});

test('a dropped tag is appended rather than lost', () => {
  const { tags } = maskTemplateTags('{topic} near {location}');
  assert.equal(
    unmaskTemplateTags('@@__T0__@@ cerca', tags),
    '{topic} cerca {location}',
  );
});

test('text without tags is unchanged', () => {
  const masked = maskTemplateTags('Food banks');
  assert.deepEqual(masked, { text: 'Food banks', tags: [] });
  assert.equal(
    unmaskTemplateTags('Bancos de alimentos', masked.tags),
    'Bancos de alimentos',
  );
});
