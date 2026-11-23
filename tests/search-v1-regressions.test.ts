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
  assert.match(s, /result\.phone && !noDial/);
  assert.match(s, /getPhoneHref\(result\.phone\)/);
  assert.match(s, /referralType="call_referral"/);
});

test('no-results-card: query label shows for everyone; the number goes through the one DialButton path', () => {
  const s = read('no-results-card.tsx');
  assert.match(s, /<CardDescription>/);
  assert.match(
    s,
    /searchParams\?\.get\('query_label'\) \|\| searchParams\?\.get\('query'\)/,
  );
  assert.match(s, /<DialButton/);
  assert.doesNotMatch(s, /useIsV2|LocalizedLink/);
  // `text` replaces the footer message (the v2 weak-match note).
  assert.match(s, /text: textOverride/);
});

test('the info-block phone dials in v1 and shows text only in v2', () => {
  const s = read('search-card-components/phone.tsx');
  assert.match(s, /getPhoneHref\(result\.phone, \{ noDial \}\)/);
});

// Print + Share on the v2 results page: the same v1 components, fed by the v2 cards (bridge).
import { v2Results } from '../src/app/(app)/features/search/v2/v2-results';

test('v2 page: Print gets the ids of the v2 cards the page shows', () => {
  const data = {
    search: {
      hits: {
        total: 2,
        hits: [
          { _id: 'a', _source: { service_at_location_id: 'sal-a', name: 'A' } },
          { _id: 'b', _source: { service_at_location_id: 'sal-b', name: 'B' } },
        ],
      },
    },
  } as never;
  const { results } = v2Results(data, [])!;
  const ids = results.map((r) => r.id || r._id).filter(Boolean);
  assert.deepEqual(ids, ['sal-a', 'sal-b']);
});

test('v2 page uses the one v1 results-section (no second print/share copy)', () => {
  const s = readFileSync(
    'src/app/(app)/features/search/components/v2-results-bridge.tsx',
    'utf8',
  );
  assert.doesNotMatch(s, /DirectoryPrintControl|ShareButton/);
});
