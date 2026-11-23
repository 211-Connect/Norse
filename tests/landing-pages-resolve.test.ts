import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  type LandingStore,
  type PageRow,
  type SlugRow,
  resolveLandingPath,
} from '../src/app/(app)/features/landing-pages/lib/resolve';
import type { LandingPageView } from '../src/app/(app)/features/landing-pages/lib/types';

function fakeStore(pages: PageRow[], slugs: SlugRow[]): LandingStore {
  return {
    async findSlug(locale, path) {
      return slugs.find((s) => s.locale === locale && s.path === path) ?? null;
    },
    async findPage(id) {
      return pages.find((p) => p.id === id) ?? null;
    },
    async currentPath(pageId, locale) {
      return (
        slugs.find(
          (s) => s.pageId === pageId && s.locale === locale && s.current,
        )?.path ?? null
      );
    },
    async view(pageId, locale) {
      return { id: pageId, path: `${locale}:${pageId}` } as LandingPageView;
    },
  };
}

const slug = (pageId: string, path: string, current = true, locale = 'en') => ({
  pageId,
  locale,
  path,
  current,
});

describe('resolveLandingPath', () => {
  const store = fakeStore(
    [
      { id: '1', status: 'live' },
      { id: '2', status: 'off', redirectPageId: '1' },
      { id: '3', status: 'retired' },
      { id: '4', status: 'retired', redirectPath: '/search?query=food' },
      { id: '5', status: 'off' },
      { id: '6', status: 'retired', redirectPageId: '2' },
    ],
    [
      slug('1', 'food/tacoma-wa'),
      slug('1', 'food-banks/tacoma-wa', false),
      slug('1', 'alimentos/tacoma-wa', true, 'es'),
      slug('2', 'food/fife-wa'),
      slug('3', 'food/ruston-wa'),
      slug('4', 'food/milton-wa'),
      slug('5', 'food/puyallup-wa'),
      slug('6', 'food/old-town-wa'),
    ],
  );

  test('a live page at its current path', async () => {
    const result = await resolveLandingPath(store, 'en', 'food/tacoma-wa');
    assert.equal(result.kind, 'page');
  });

  test('an old path redirects to the current one', async () => {
    assert.deepEqual(
      await resolveLandingPath(store, 'en', 'food-banks/tacoma-wa'),
      { kind: 'redirect', path: 'food/tacoma-wa' },
    );
  });

  test('paths are per locale', async () => {
    assert.equal(
      (await resolveLandingPath(store, 'es', 'alimentos/tacoma-wa')).kind,
      'page',
    );
    assert.deepEqual(await resolveLandingPath(store, 'es', 'food/tacoma-wa'), {
      kind: 'not-found',
    });
  });

  test('an off page redirects to its target page', async () => {
    assert.deepEqual(await resolveLandingPath(store, 'en', 'food/fife-wa'), {
      kind: 'redirect',
      path: 'food/tacoma-wa',
    });
  });

  test('targets are followed to a live page', async () => {
    assert.deepEqual(
      await resolveLandingPath(store, 'en', 'food/old-town-wa'),
      {
        kind: 'redirect',
        path: 'food/tacoma-wa',
      },
    );
  });

  test('a target path is returned as stored', async () => {
    assert.deepEqual(await resolveLandingPath(store, 'en', 'food/milton-wa'), {
      kind: 'redirect',
      path: '/search?query=food',
    });
  });

  test('retired with no target is gone, off with none is not found', async () => {
    assert.deepEqual(await resolveLandingPath(store, 'en', 'food/ruston-wa'), {
      kind: 'gone',
    });
    assert.deepEqual(
      await resolveLandingPath(store, 'en', 'food/puyallup-wa'),
      { kind: 'not-found' },
    );
  });

  test('an unknown path is not found', async () => {
    assert.deepEqual(await resolveLandingPath(store, 'en', 'food/nowhere-wa'), {
      kind: 'not-found',
    });
  });

  test('a redirect loop ends in not found', async () => {
    const loop = fakeStore(
      [
        { id: 'a', status: 'off', redirectPageId: 'b' },
        { id: 'b', status: 'off', redirectPageId: 'a' },
      ],
      [slug('a', 'x/y')],
    );
    assert.deepEqual(await resolveLandingPath(loop, 'en', 'x/y'), {
      kind: 'not-found',
    });
  });
});
