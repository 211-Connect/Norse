import assert from 'node:assert/strict';
import test from 'node:test';

import { noDialEnabled } from '../src/app/(app)/features/search/components/no-dial-flag';
import {
  formatPhoneNumber,
  getPhoneHref,
} from '../src/app/(app)/shared/utils/phone';

test('v1: provider phone numbers dial through tel: (restored, every tenant)', () => {
  assert.equal(getPhoneHref('(253) 403-4437'), 'tel:+12534034437');
  assert.equal(getPhoneHref('253-403-4437;ext=2'), 'tel:+12534034437,2');
  assert.equal(getPhoneHref('garbage'), 'tel:garbage');
  assert.equal(getPhoneHref(null), '');
  assert.equal(getPhoneHref(undefined), '');
});

test('v2 (noDial): provider phone numbers never produce a tel: link', () => {
  for (const raw of [
    '(253) 403-4437',
    '253-403-4437;ext=2',
    '911',
    'garbage',
  ]) {
    assert.equal(getPhoneHref(raw, { noDial: true }), '', raw);
  }
});

test('the number still shows as text', () => {
  assert.equal(formatPhoneNumber('2534034437'), '(253) 403-4437');
});

test('noDialEnabled is on only for the exact string "true"', () => {
  assert.equal(noDialEnabled('true'), true);
  for (const v of [undefined, '', 'false', 'TRUE']) {
    assert.equal(noDialEnabled(v), false, String(v));
  }
});
