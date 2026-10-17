// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// One harness per group of BUILDERS.md paths. `paths` names the BUILDERS rows a harness covers;
// coverage.test.ts fails if any row is covered by none.
import {
  dialogCases,
  filterCases,
  languageCases,
  paginationCases,
  panelCases,
  sortCases,
} from './client';
import { PROFILES } from './edges';
import {
  categoryCases,
  cmsLinkCases,
  noFavoritesCases,
  topicCases,
} from './links';
import { proxyCases } from './routing';
import { directoryCases } from './directories';
import { submitCases } from './submit';
import {
  backToResultsCases,
  resource404Cases,
  shareCases,
  widgetConfigCases,
} from './misc';
import { localeFor, runServerPage } from './server-page';
import type { Row } from './snapshots';

export type Harness = {
  id: string;
  paths: string[];
  cases: (corpus: Row[]) => AsyncIterable<{ case: string; output: unknown }>;
};

// The visitor's preference cookies, every combination the middleware branches on.
const COOKIE_CASES = (['', 'synthetic place'] as const).flatMap((location) =>
  (['', '-122.3,47.6', 'not-coords'] as const).flatMap((coords) =>
    (['', '25'] as const).map((distance) => ({ location, coords, distance })),
  ),
);

async function middlewareCase(
  path: string,
  query: string,
  cookies: (typeof COOKIE_CASES)[number],
) {
  const { NextRequest } = await import('next/server');
  const { searchLinkCorrectionMiddleware } =
    await import('../../../src/middlewares/searchLinkCorrectionMiddleware');
  const { USER_PREF_COORDS, USER_PREF_DISTANCE, USER_PREF_LOCATION } =
    await import('../../../src/app/(app)/shared/lib/constants');
  const jar = [
    cookies.location &&
      `${USER_PREF_LOCATION}=${encodeURIComponent(cookies.location)}`,
    cookies.coords &&
      `${USER_PREF_COORDS}=${encodeURIComponent(cookies.coords)}`,
    cookies.distance &&
      `${USER_PREF_DISTANCE}=${encodeURIComponent(cookies.distance)}`,
  ].filter(Boolean);
  const origin = 'https://tenant.test';
  const req = new NextRequest(`${origin}${path}${query ? `?${query}` : ''}`, {
    headers: jar.length ? { cookie: jar.join('; ') } : {},
  });
  const res = searchLinkCorrectionMiddleware(req);
  if (!res) return { response: 'pass-through' };
  const location = res.headers.get('location');
  return {
    status: res.status,
    location: location?.startsWith(origin)
      ? location.slice(origin.length)
      : location,
  };
}

/**
 * Canonical AI and clarify URLs are long, and Umami cut most of them off (ISS-2378), so the corpus barely
 * has them. They are exactly what the dialog writes, so every distinct URL the dialog harness produces is
 * fed back through the search page under every profile.
 */
async function* writerOutputCases(corpus: Row[]) {
  const urls = new Set<string>();
  for await (const c of dialogCases(corpus)) {
    for (const u of (c.output as { pushes: string[] }).pushes) urls.add(u);
  }
  for (const url of [...urls].sort()) {
    const [path, query = ''] = url.split('?');
    for (const profile of PROFILES) {
      for (const c of await runServerPage(path, query, profile))
        yield { case: `${url}|${c.id}`, output: c.output };
    }
  }
}

export const HARNESSES: Harness[] = [
  { id: 'proxy', paths: ['23', '24'], cases: proxyCases },
  { id: 'directories', paths: ['11', '15', '16'], cases: directoryCases },
  { id: 'dialog-route', paths: ['3', '1', '2a'], cases: submitCases },
  { id: 'back-to-results', paths: ['18'], cases: backToResultsCases },
  { id: 'widget-config', paths: ['21'], cases: widgetConfigCases },
  { id: 'share', paths: ['25'], cases: shareCases },
  { id: 'resource-404', paths: ['26'], cases: resource404Cases },
  { id: 'topic-cards', paths: ['12', '13'], cases: topicCases },
  { id: 'category-badges', paths: ['14'], cases: categoryCases },
  { id: 'no-favorites', paths: ['17'], cases: noFavoritesCases },
  { id: 'cms-links', paths: ['19', '20'], cases: cmsLinkCases },
  { id: 'dialog-submit', paths: ['1', '2a', '2b', '2c'], cases: dialogCases },
  {
    id: 'server-page-writer-output',
    paths: ['4', '5', '6'],
    cases: writerOutputCases,
  },
  { id: 'filter-actions', paths: ['7a', '7b'], cases: filterCases },
  { id: 'filter-panel', paths: ['7c', '7d'], cases: panelCases },
  { id: 'sort', paths: ['8'], cases: sortCases },
  { id: 'pagination', paths: ['9'], cases: paginationCases },
  { id: 'language', paths: ['10'], cases: languageCases },
  {
    // Every /search request passes through this first: location, coords and distance from cookies.
    id: 'middleware',
    paths: ['22'],
    async *cases(corpus) {
      for (const row of corpus) {
        for (const c of COOKIE_CASES) {
          const id = `loc=${c.location ? 'y' : 'n'},coords=${c.coords === '' ? 'n' : c.coords === 'not-coords' ? 'bad' : 'y'},dist=${c.distance ? 'y' : 'n'}`;
          yield {
            case: `${row.scenario}|${id}`,
            output: await middlewareCase(row.path, row.query, c),
          };
        }
      }
    },
  },
  {
    // The search page as a request: parse, coords redirect (4), legacy AI gate (5, 6), Norse-API request,
    // metadata and the state handed to the browser.
    id: 'server-page',
    paths: ['4', '5', '6'],
    async *cases(corpus) {
      for (const row of corpus) {
        if (!localeFor(row.path)) continue; // routing, not this page: see 'routing' below
        for (const profile of PROFILES) {
          for (const c of await runServerPage(row.path, row.query, profile)) {
            yield { case: `${row.scenario}|${c.id}`, output: c.output };
          }
        }
      }
    },
  },
];
