import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getGoogleSiteVerification } from '../src/app/(app)/shared/utils/googleSiteVerification';

test('returns the configured token for metadata.verification.google', () => {
  assert.deepEqual(getGoogleSiteVerification('bXzA2bXZ4-token'), [
    'bXzA2bXZ4-token',
  ]);
});

test('splits several comma-separated tokens and trims whitespace', () => {
  assert.deepEqual(getGoogleSiteVerification(' one , two,,three '), [
    'one',
    'two',
    'three',
  ]);
});

test('returns undefined so the tag is omitted when nothing is configured', () => {
  assert.equal(getGoogleSiteVerification(undefined), undefined);
  assert.equal(getGoogleSiteVerification(''), undefined);
  assert.equal(getGoogleSiteVerification(' , '), undefined);
});
