import type { LandingPageView, LandingResolution } from './types';

/** A row of `landing-page-slugs`. */
export type SlugRow = {
  pageId: string;
  locale: string;
  path: string;
  current: boolean;
};

export type PageStatus = 'live' | 'off' | 'retired';

/** What resolution needs to know about a page. */
export type PageRow = {
  id: string;
  status: PageStatus;
  /** Another landing page to send visitors to, when not live. */
  redirectPageId?: string | null;
  /** A site path (e.g. a `/search?…` URL) to send visitors to, when not live. */
  redirectPath?: string | null;
};

/** Reads resolution needs; the CMS implements it over Payload. */
export interface LandingStore {
  findSlug(locale: string, path: string): Promise<SlugRow | null>;
  findPage(id: string): Promise<PageRow | null>;
  /** The page's current path in a locale, or null. */
  currentPath(pageId: string, locale: string): Promise<string | null>;
  /** The full view of a live page in a locale. */
  view(pageId: string, locale: string): Promise<LandingPageView | null>;
}

/** Redirect targets are kept chain-free when written; this only guards loops. */
const MAX_HOPS = 5;

/**
 * What a landing-page path answers in a locale:
 *
 * - current slug of a live page → the page;
 * - an old slug of a live page → redirect to its current slug;
 * - a page that is `off` or `retired` → redirect to its target page (in the
 *   same locale) or target path; `retired` with no target → gone (410);
 *   `off` with no target → not found;
 * - a path no page ever had → not found.
 *
 * Returned redirect paths have no locale prefix when they are landing paths;
 * a `redirectPath` is returned as stored (it starts with `/`).
 */
export async function resolveLandingPath(
  store: LandingStore,
  locale: string,
  path: string,
): Promise<LandingResolution> {
  const slug = await store.findSlug(locale, path);
  if (!slug) return { kind: 'not-found' };

  let pageId = slug.pageId;
  let viaRedirect = false;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const page = await store.findPage(pageId);
    if (!page) return { kind: 'not-found' };

    if (page.status === 'live') {
      const current = await store.currentPath(page.id, locale);
      if (!current) return { kind: 'not-found' };
      if (viaRedirect || current !== path) {
        return { kind: 'redirect', path: current };
      }
      const view = await store.view(page.id, locale);
      return view ? { kind: 'page', page: view } : { kind: 'not-found' };
    }

    if (page.redirectPageId) {
      pageId = page.redirectPageId;
      viaRedirect = true;
      continue;
    }
    if (page.redirectPath) return { kind: 'redirect', path: page.redirectPath };
    return page.status === 'retired' ? { kind: 'gone' } : { kind: 'not-found' };
  }
  return { kind: 'not-found' };
}
