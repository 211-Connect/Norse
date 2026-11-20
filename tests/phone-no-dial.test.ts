import assert from 'node:assert/strict';
import test from 'node:test';

import { NO_DIAL } from '../src/app/(app)/features/search/components/no-dial-flag';
import {
  formatPhoneNumber,
  getPhoneHref,
} from '../src/app/(app)/shared/utils/phone';

test('v1 (default): provider phone numbers dial through tel: (v1 tenants unchanged)', () => {
  assert.equal(getPhoneHref('(253) 403-4437'), 'tel:+12534034437');
  assert.equal(getPhoneHref('253-403-4437;ext=2'), 'tel:+12534034437,2');
});

test('switch on, v2 tenant: provider phone numbers never produce a tel: link', () => {
  for (const raw of [
    '(253) 403-4437',
    '253-403-4437;ext=2',
    '+44 20 7946 0958',
    '911',
    '988',
    '211',
    'garbage',
  ]) {
    assert.equal(getPhoneHref(raw, { noDial: NO_DIAL }), '', raw);
  }
  assert.equal(getPhoneHref(null, { noDial: NO_DIAL }), '');
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

test('the no-dial switch is ON in every environment until the turn-on PR (Lucas 2026-11-20)', () => {
  assert.equal(NO_DIAL, true);
});

test('switch off (the turn-on PR): provider phone numbers dial through tel:', () => {
  assert.equal(
    getPhoneHref('(253) 403-4437', { noDial: false }),
    'tel:+12534034437',
  );
  assert.equal(
    getPhoneHref('253-403-4437;ext=2', { noDial: false }),
    'tel:+12534034437,2',
  );
  assert.equal(getPhoneHref('garbage', { noDial: false }), 'tel:garbage');
  assert.equal(getPhoneHref(null, { noDial: false }), '');
  assert.equal(getPhoneHref('(253) 403-4437', { noDial: true }), '');
});
