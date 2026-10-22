// Every /search URL built in code goes through the search-intent serializer, or is one of the hand-built
// links pinned by a fixture (tests/search-intent-hand-built-links.test.ts), or is listed here with why it
// may build its own. A new /search URL anywhere else fails this test: route it through the serializer, or
// add it here with a fixture and a reason.
//
// It finds a string or template literal that opens with /search (or has it straight after an interpolation),
// followed by `?`, `${` or the end of the literal. Writers that edit the current URL without spelling out
// /search (sort, pagination, the language switcher) are caught by the second scan, below.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const SRC = join(import.meta.dirname, '../src');

/** Where a /search URL may be spelled out, how many times, and why. */
const ALLOWED: Record<string, { count: number; why: string }> = {
  'app/(app)/features/search/intent/serialize.ts': {
    count: 1,
    why: 'the serializer',
  },
  'app/(app)/features/search/utils/handBuiltSearchLinks.ts': {
    count: 3,
    why: 'hand-built links, each pinned by a fixture',
  },
  'app/(app)/features/search/components/filter/use-search-results-navigation.ts':
    {
      count: 1,
      why: 'filter navigation re-serialises the raw parameters until ISS-2409',
    },
  'app/(app)/features/search/utils/navigateToSearchWithCoords.ts': {
    count: 1,
    why: 'the coords redirect re-serialises the raw parameters until ISS-2409',
  },
  'app/(app)/[locale]/(rest)/search/page.tsx': {
    count: 1,
    why: 'the request URL for bot protection, not a link',
  },
  'app/(app)/shared/services/search-service.ts': {
    count: 2,
    why: 'Norse-API requests, not page URLs',
  },
  'app/(app)/shared/lib/paths.ts': {
    count: 1,
    why: 'recognises the search pathname, builds no URL',
  },
};

// `/search` opening a literal, or straight after an interpolation (`/${locale}/search`, `${API_URL}/search`),
// and then `?`, `${` or the end of the literal. Import paths such as '@/…/search' do not open with it.
const SEARCH_LITERAL = /(?<=['"`]|\})\/search(?=\?|\$\{|['"`])/g;

/**
 * The capability to navigate or rewrite the current URL: a `useRouter()` call (whatever the variable is
 * named), a history call, `location.assign`, `window.open`, or a read of the browser's current URL.
 * These are the writers that can emit a /search URL without ever spelling it.
 */
const URL_EDIT =
  /useRouter\s*\(|history\.(?:pushState|replaceState)\s*\(|window\.open\s*\(|(?:window\.)?location\.(?:assign\s*\(|href|pathname|search)/g;

/** Where the current URL may be edited or navigated to, how many times, and why. */
const ALLOWED_EDITS: Record<string, { count: number; why: string }> = {
  'app/(app)/features/search/components/sort-select.tsx': {
    count: 1,
    why: 'sort edits the current URL (BUILDERS 8, parity harness "sort")',
  },
  'app/(app)/features/search/components/filter/use-search-results-navigation.ts':
    {
      count: 1,
      why: 'filter navigation pushes its re-serialised URL until ISS-2409 (BUILDERS 7)',
    },
  'app/(app)/features/search/hooks/useNavigateClassicSearch.ts': {
    count: 1,
    why: 'pushes what buildSearchUrl wrote (BUILDERS 1)',
  },
  'app/(app)/features/search/hooks/useNavigateAiSearch.ts': {
    count: 1,
    why: 'pushes what buildSearchUrl wrote (BUILDERS 2)',
  },
  'app/(app)/features/search/hooks/useOnSearchSubmit.ts': {
    count: 2,
    why: 'a typeahead topic of type link opens its CMS href verbatim (BUILDERS 3)',
  },
  'app/(app)/shared/components/language-switcher.tsx': {
    count: 1,
    why: 'swaps the locale prefix on the current URL (BUILDERS 10)',
  },
  'app/(app)/shared/components/printable-directories/save-source-to-directory-button.tsx':
    {
      count: 1,
      why: 'navigates to the directory after a save (the context params are removed by use-printable-directory-search-context)',
    },
  'app/(app)/shared/hooks/use-printable-directory-search-context.ts': {
    count: 1,
    why: 'dismissing the directory context removes pdid, pdsid and pdsrcid from the current URL (BUILDERS 11) and keeps the rest as received',
  },
  'app/(app)/shared/components/header.tsx': {
    count: 3,
    why: 'favorites links, and the sign-in callback that round-trips the current URL (BUILDERS 23)',
  },
  'app/(app)/shared/components/global-dialogs/promt-auth-dialog.tsx': {
    count: 3,
    why: 'the sign-in callback that round-trips the current URL (BUILDERS 23)',
  },
  'app/(app)/shared/components/share-button.tsx': {
    count: 1,
    why: 'reads the current URL to shorten it (BUILDERS 25)',
  },
  'app/(app)/features/resource/hooks/use-resource-view-tracking.ts': {
    count: 2,
    why: 'removes the retired entry parameter from a resource page URL',
  },
  'app/(app)/shared/components/directory-print/directory-download-dialog.tsx': {
    count: 1,
    why: 'removes its own parameters from the current URL',
  },
  'app/(app)/features/favorites/components/favorite-lists-section.tsx': {
    count: 1,
    why: 'edits the current URL on /favorites, never /search',
  },
  'app/(app)/features/favorites/components/create-a-list-button.tsx': {
    count: 1,
    why: 'edits the current URL on /favorites, never /search',
  },
  'app/(app)/features/favorites/components/delete-favorite-list-button.tsx': {
    count: 1,
    why: 'edits the current URL on /favorites, never /search',
  },
  'app/(app)/features/favorites/components/purge-favorite-list-button.tsx': {
    count: 1,
    why: 'edits the current URL on /favorites, never /search',
  },
  'app/(app)/features/favorites/components/update-favorite-list-button.tsx': {
    count: 1,
    why: 'edits the current URL on /favorites, never /search',
  },
  'app/(app)/shared/hooks/use-sync-local-favorites-on-auth.ts': {
    count: 1,
    why: 'refreshes the page after sign-in, no URL built',
  },
  'app/(app)/features/printable-directories/components/printable-directory-detail.tsx':
    {
      count: 1,
      why: 'navigates to a directory page',
    },
  'app/(app)/features/printable-directories/components/directories-list.tsx': {
    count: 1,
    why: 'navigates to a directory page',
  },
  'app/(app)/[locale]/(rest)/auth/error/actions.tsx': {
    count: 1,
    why: 'Keycloak logout, a fixed path',
  },
  'app/(app)/features/error/components/error-boundary.tsx': {
    count: 1,
    why: 'reads the current URL into an error report',
  },
  'app/(app)/shared/components/page-view.tsx': {
    count: 1,
    why: 'reads the current URL into the page-view analytics event',
  },
  'app/(app)/shared/components/report-button.tsx': {
    count: 1,
    why: 'reads the current URL into the report form',
  },
  'app/(app)/shared/components/get-directions-button.tsx': {
    count: 1,
    why: 'opens a maps URL',
  },
  'app/(app)/shared/components/sms-button.tsx': {
    count: 1,
    why: 'sets an sms: link',
  },
  'app/(app)/shared/components/directory-print/openPdfDocument.ts': {
    count: 1,
    why: 'opens the PDF',
  },
};

/** The source without comment lines, so prose mentioning `/search` is not counted. */
const code = (source: string) =>
  source
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join('\n');

function scan(pattern: RegExp, skipPayload = false): Map<string, number> {
  const found = new Map<string, number>();
  for (const entry of readdirSync(SRC, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) continue;
    const file = join(entry.parentPath, entry.name);
    const path = relative(SRC, file);
    if (path.startsWith('lib/api/generated/')) continue; // generated API client
    if (skipPayload && path.startsWith('payload/')) continue; // the admin UI never links to /search
    const n = code(readFileSync(file, 'utf8')).match(pattern)?.length ?? 0;
    if (n) found.set(path, n);
  }
  return found;
}

const searchLiterals = () => scan(SEARCH_LITERAL);
const urlEdits = () => scan(URL_EDIT, true);

test('every /search URL in code is the serializer, a fixtured link, or listed', () => {
  const found = searchLiterals();
  assert.ok(
    found.size >= 5,
    `only ${found.size} files found: the scan is not reaching src`,
  );
  const unexpected = [...found]
    .filter(([path, n]) => ALLOWED[path]?.count !== n)
    .map(([path, n]) => `${path}: ${n} (allowed ${ALLOWED[path]?.count ?? 0})`);
  assert.deepStrictEqual(unexpected, []);
  const gone = Object.keys(ALLOWED).filter((path) => !found.has(path));
  assert.deepStrictEqual(
    gone,
    [],
    'listed but no longer present: remove from ALLOWED',
  );
});

test('every writer that edits the current URL is listed, with a reason', () => {
  const found = urlEdits();
  assert.ok(
    found.size >= 5,
    `only ${found.size} files found: the scan is not reaching src`,
  );
  const unexpected = [...found]
    .filter(([path, n]) => ALLOWED_EDITS[path]?.count !== n)
    .map(
      ([path, n]) =>
        `${path}: ${n} (allowed ${ALLOWED_EDITS[path]?.count ?? 0})`,
    );
  assert.deepStrictEqual(unexpected, []);
  const gone = Object.keys(ALLOWED_EDITS).filter((path) => !found.has(path));
  assert.deepStrictEqual(
    gone,
    [],
    'listed but no longer present: remove from ALLOWED_EDITS',
  );
});
