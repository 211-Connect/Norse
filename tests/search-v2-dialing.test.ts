// Lucas 2026-11-23: the V2_DIAL_TENANT_IDS no-dial switch is removed. Every phone number dials on
// v2 as on v1, with no env set. v2 itself stays behind the tenant's enableV2Api flag.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { DialButton } from '../src/app/(app)/features/search/components/dial-button';
import { appConfigContext } from '../src/app/(app)/shared/context/app-config-context';
import {
  formatPhoneNumber,
  getPhoneHref,
} from '../src/app/(app)/shared/utils/phone';

test('with no env set, a provider phone dials through tel:', () => {
  delete process.env.V2_DIAL_TENANT_IDS;
  assert.equal(getPhoneHref('(253) 403-4437'), 'tel:+12534034437');
  assert.equal(getPhoneHref('253-403-4437;ext=2'), 'tel:+12534034437,2');
  assert.equal(getPhoneHref('garbage'), 'tel:garbage');
  assert.equal(getPhoneHref(null), '');
  assert.equal(formatPhoneNumber('2534034437'), '(253) 403-4437');
});

test('with no env set, a v2 tenant renders a dialing link', () => {
  delete process.env.V2_DIAL_TENANT_IDS;
  const html = renderToStaticMarkup(
    createElement(
      appConfigContext.Provider,
      { value: { featureFlags: { enableV2Api: true } } as never },
      createElement(DialButton, {
        number: '(253) 403-4437',
        children: 'Call',
      }),
    ),
  );
  assert.match(html, /href="tel:\+12534034437"/);
});

test('the search card phone and Call button read no switch on v2', () => {
  const dir =
    'src/app/(app)/features/search/components/search-card-components/';
  for (const f of ['phone.tsx', 'action-buttons.tsx']) {
    const s = readFileSync(dir + f, 'utf8');
    assert.doesNotMatch(s, /noDial|useNoDial/, f);
  }
  const build = readFileSync(
    'src/app/(app)/shared/utils/buildAppConfig.ts',
    'utf8',
  );
  assert.doesNotMatch(build, /V2_DIAL|v2DialingEnabled/);
});
