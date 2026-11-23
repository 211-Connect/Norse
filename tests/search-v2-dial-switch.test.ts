import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  dialingAllowed,
  NO_DIAL,
  noDialFor,
  V2_DIAL_TENANTS_ENV,
} from '../src/app/(app)/features/search/components/no-dial-flag';
import { getPhoneHref } from '../src/app/(app)/shared/utils/phone';

test('default: the no-dial switch is on, an unset or empty list turns nobody on', () => {
  assert.equal(NO_DIAL, true);
  for (const list of [undefined, null, '', '  ', ',', ' , ,']) {
    assert.equal(dialingAllowed('T-1', list), false, JSON.stringify(list));
  }
  assert.equal(dialingAllowed(undefined, 'T-1'), false);
  assert.equal(dialingAllowed('', 'T-1'), false);
});

test('only an exact tenant id in the list turns dialing on (no wildcard, no prefix)', () => {
  assert.equal(dialingAllowed('T-1', 'T-1'), true);
  assert.equal(dialingAllowed('T-2', ' T-1 , T-2 '), true);
  assert.equal(dialingAllowed('T-3', 'T-1,T-2'), false);
  assert.equal(dialingAllowed('T-1', 'T-10'), false);
  assert.equal(dialingAllowed('T-10', 'T-1'), false);
  assert.equal(dialingAllowed('T-1', '*'), false);
  assert.equal(dialingAllowed('t-1', 'T-1'), false);
});

test('v2 tenant: no dial by default; dials only when turned on; v1 always dials', () => {
  assert.equal(noDialFor({ enableV2Api: true }), true);
  assert.equal(noDialFor({ enableV2Api: true, v2DialingEnabled: false }), true);
  assert.equal(noDialFor({ enableV2Api: true, v2DialingEnabled: true }), false);
  assert.equal(noDialFor({ enableV2Api: false }), false);
  assert.equal(noDialFor({}), false);
  // A missing or garbage flag value never turns dialing on.
  assert.equal(
    noDialFor({ enableV2Api: true, v2DialingEnabled: 'yes' as never }),
    true,
  );
});

test('the numbers dial through tel: when the tenant is turned on, and not before', () => {
  const off = noDialFor({ enableV2Api: true });
  const on = noDialFor({ enableV2Api: true, v2DialingEnabled: true });
  assert.equal(getPhoneHref('(253) 403-4437', { noDial: off }), '');
  assert.equal(
    getPhoneHref('(253) 403-4437', { noDial: on }),
    'tel:+12534034437',
  );
});

test('the seam: the env name is read in buildAppConfig and the hook reads the config flag', () => {
  const build = readFileSync(
    'src/app/(app)/shared/utils/buildAppConfig.ts',
    'utf8',
  );
  assert.match(build, /v2DialingEnabled: dialingAllowed\(/);
  assert.match(build, /process\.env\[V2_DIAL_TENANTS_ENV\]/);
  assert.equal(V2_DIAL_TENANTS_ENV, 'V2_DIAL_TENANT_IDS');
  // The failed-config default (no resource directory) never turns dialing on.
  assert.match(build, /enableV2Api: false,\s+v2DialingEnabled: false,/);
  const hook = readFileSync(
    'src/app/(app)/shared/hooks/use-no-dial.ts',
    'utf8',
  );
  assert.match(hook, /noDialFor\(useAppConfig\(\)\.featureFlags\)/);
});
