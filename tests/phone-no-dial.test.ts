import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatPhoneNumber,
  getPhoneHref,
} from '../src/app/(app)/shared/utils/phone';

test('provider phone numbers never produce a tel: link', () => {
  for (const raw of ['(253) 403-4437', '253-403-4437;ext=2', '+44 20 7946 0958', '911', '988', '211', 'garbage']) {
    assert.equal(getPhoneHref(raw), '', raw);
  }
  assert.equal(getPhoneHref(null), '');
  assert.equal(getPhoneHref(undefined), '');
});

test('the number still shows as text', () => {
  assert.equal(formatPhoneNumber('2534034437'), '(253) 403-4437');
});
