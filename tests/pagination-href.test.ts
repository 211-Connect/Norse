import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  localizeHref,
  paginationHref,
} from '../src/app/(app)/shared/lib/localized-href';

// What the browser ends up with: CustomPagination builds the href from
// usePathname(), then LocalizedLink adds the locale prefix (ISS-2404).
function renderedHref(
  pathname: string,
  query: string,
  currentLanguage: string,
  defaultLocale = 'en',
): string {
  return localizeHref(
    paginationHref(pathname, query, currentLanguage, defaultLocale),
    currentLanguage,
    defaultLocale,
  );
}

const query = '?query=food&query_type=text&page=2';

test('default locale pagination hrefs are unchanged', () => {
  assert.equal(renderedHref('/search', query, 'en'), `/search${query}`);
  assert.equal(renderedHref('/search/', query, 'en'), `/search/${query}`);
  assert.equal(
    renderedHref('/favorites', '?page=3', 'en'),
    '/favorites?page=3',
  );
});

test('non-default locale pagination hrefs carry the locale once', () => {
  assert.equal(renderedHref('/es/search', query, 'es'), `/es/search${query}`);
  assert.equal(
    renderedHref('/zh-Hans/search', query, 'zh-Hans'),
    `/zh-Hans/search${query}`,
  );
  assert.equal(
    renderedHref('/es/favorites', '?page=3', 'es'),
    '/es/favorites?page=3',
  );
});

test('trailing-slash pathnames (MBOA) keep the slash and a single locale', () => {
  assert.equal(renderedHref('/es/search/', query, 'es'), `/es/search/${query}`);
});

test('a tenant whose default locale is not en is handled by its own default', () => {
  assert.equal(renderedHref('/search', query, 'es', 'es'), `/search${query}`);
  assert.equal(
    renderedHref('/en/search', query, 'en', 'es'),
    `/en/search${query}`,
  );
});

test('only a whole leading locale segment is stripped', () => {
  // `/es` must not be stripped from `/esearch` or a path that merely contains it.
  assert.equal(renderedHref('/esearch', query, 'es'), `/es/esearch${query}`);
  assert.equal(renderedHref('/es', '?page=2', 'es'), '/es/?page=2');
});

test('localizeHref mirrors LocalizedLink', () => {
  assert.equal(localizeHref('/search', 'en', 'en'), '/search');
  assert.equal(localizeHref('/search', 'es', 'en'), '/es/search');
  assert.equal(localizeHref('https://x.org/a', 'es', 'en'), 'https://x.org/a');
});
