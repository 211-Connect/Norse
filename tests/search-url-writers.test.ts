// Every /search URL built in code goes through the search-intent serializer, or is one of the hand-built
// links pinned by a fixture (tests/search-intent-hand-built-links.test.ts), or is listed here with why it
// may build its own. A new /search URL anywhere else fails this test: route it through the serializer, or
// add it here with a fixture and a reason.
//
// It finds a string or template literal that opens with /search (or has it straight after an interpolation),
// followed by `?`, `${` or the end of the literal. Writers
// that edit the current URL without spelling out /search (sort, pagination, the language switcher) are not
// seen here; tests/search-intent-cutover/BUILDERS.md lists them.
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

/** The source without comment lines, so prose mentioning `/search` is not counted. */
const code = (source: string) =>
  source
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join('\n');

function searchLiterals(): Map<string, number> {
  const found = new Map<string, number>();
  for (const entry of readdirSync(SRC, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) continue;
    const file = join(entry.parentPath, entry.name);
    const path = relative(SRC, file);
    if (path.startsWith('lib/api/generated/')) continue; // generated API client
    const n =
      code(readFileSync(file, 'utf8')).match(SEARCH_LITERAL)?.length ?? 0;
    if (n) found.set(path, n);
  }
  return found;
}

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
