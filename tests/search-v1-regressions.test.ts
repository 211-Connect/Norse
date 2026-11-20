// v1 behavior that #1222 dropped for every tenant, restored (norse-search-ux order, 2026-11-20).
// Any v2 difference sits behind useIsV2() (true only while /v2/search results show).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (f: string) =>
  readFileSync(`src/app/(app)/features/search/components/${f}`, 'utf8');

test('results-section: Print and Share are rendered, with no v2 condition', () => {
  const s = read('results-section.tsx');
  assert.match(s, /<DirectoryPrintControl/);
  assert.match(s, /<ShareButton title=\{shareTitle\} body=\{shareBody\} \/>/);
  const before = s.slice(0, s.indexOf('<ShareButton'));
  assert.doesNotMatch(before.slice(-300), /isV2|useIsV2/);
});

test('action-buttons: v1 keeps the ReferralButton + tel: Call link; only v2 drops it', () => {
  const s = read('search-card-components/action-buttons.tsx');
  assert.match(s, /result\.phone && !isV2/);
  assert.match(s, /getPhoneHref\(result\.phone\)/);
  assert.match(s, /referralType="call_referral"/);
});

test('no-results-card: query label shows for everyone; v1 keeps the LocalizedLink tel:', () => {
  const s = read('no-results-card.tsx');
  assert.match(s, /<CardDescription>/);
  assert.match(s, /searchParams\?\.get\('query_label'\) \|\| searchParams\?\.get\('query'\)/);
  assert.match(s, /isV2 \? \(/);
  assert.match(s, /<LocalizedLink\s+href=\{`tel:\$\{appConfig\.contact\.number\}`\}/);
});

test('the info-block phone dials in v1 and shows text only in v2', () => {
  const s = read('search-card-components/phone.tsx');
  assert.match(s, /getPhoneHref\(result\.phone, \{ noDial: isV2 \}\)/);
});
