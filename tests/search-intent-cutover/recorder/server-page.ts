// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Runs the real search page (src/app/(app)/[locale]/(rest)/search/page.tsx) for one URL and returns what
// a visitor or Norse-API could observe: the redirect, every Norse-API request, the page metadata, and the
// state handed to the browser. Internal function results are deliberately not recorded: those functions
// are replaced by the refactor, so the baseline has to be behaviour.
//
// THE ONE ADAPTER: `handoff()` reads the props the page passes to its client components. If ISS-2375
// changes those props, only this function may change, and the review of that PR checks it maps the new
// props to the same observable state.
import { type ReactElement } from 'react';

import {
  GEOCODE_OUTCOMES,
  PREDICT_OUTCOMES,
  edge,
  Marker,
  RedirectSignal,
  type Profile,
} from './edges';

type Element = ReactElement<Record<string, unknown>>;

/** Next.js passes searchParams as Record<string, string | string[]>, decoded with URLSearchParams rules. */
export function rawParamsFrom(
  query: string,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of new URLSearchParams(query)) {
    const prev = out[k];
    out[k] =
      prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  return out;
}

/** The locale segment Next routing would give `[locale]` for a path, or null when the path doesn't reach this page. */
export function localeFor(path: string): string | null {
  const segs = path
    .replace(/^\/adresources/, '')
    .split('/')
    .filter(Boolean);
  if (segs.length === 1 && segs[0] === 'search') return 'en';
  if (segs.length === 2 && segs[1] === 'search') return segs[0];
  return null; // doubled locale or another prefix: routing decides, not this page (ISS-2372 covers it live)
}

function find(el: unknown, type: unknown): Element | undefined {
  if (!el || typeof el !== 'object') return undefined;
  const e = el as Element;
  if (e.type === type) return e;
  const kids = e.props?.children;
  for (const k of Array.isArray(kids) ? kids : [kids]) {
    const hit = find(k, type);
    if (hit) return hit;
  }
  return undefined;
}

function handoff(tree: unknown) {
  const wrapper = find(tree, Marker.PageWrapper);
  const results = find(tree, Marker.SearchResultsProvider);
  const shell = find(tree, Marker.SearchPageShell);
  const value = (results?.props.value ?? {}) as Record<string, unknown>;
  return {
    search: wrapper?.props.search ?? null,
    currentPage: value.currentPage ?? null,
    sort: value.sort ?? null,
    coordinates: value.coordinates ?? null,
    clarify: shell?.props.legacyAiClarifyState ?? null,
    alert: shell?.props.aiSearchAlert ?? null,
  };
}

async function runOnce(path: string, query: string, profile: Profile) {
  const locale = localeFor(path)!;
  const page =
    await import('../../../src/app/(app)/[locale]/(rest)/search/page');
  edge.requests = [];
  edge.calls = { predict: 0, geocode: 0 };
  if (profile.advancedGeo)
    process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
  else
    delete process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG;

  const args = () => ({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve(rawParamsFrom(query)),
  });
  const out: Record<string, unknown> = {};
  try {
    const meta = (await page.generateMetadata(args() as never)) as Record<
      string,
      unknown
    >;
    out.metadata = { title: meta.title, description: meta.description };
  } catch (e) {
    out.metadata = { error: String((e as Error).message) };
  }
  try {
    const tree = await page.default(args() as never);
    out.redirect = null;
    out.handoff = handoff(tree);
  } catch (e) {
    if (e instanceof RedirectSignal) out.redirect = e.url;
    else out.error = String((e as Error).message);
  }
  out.requests = edge.requests;
  return { out, calls: { ...edge.calls } };
}

/**
 * Every distinct outcome for one URL under one profile. The page is run once; if it consulted the
 * classifier or the geocoder, it is rerun once per possible answer, so each reachable branch is recorded.
 */
export async function runServerPage(
  path: string,
  query: string,
  profile: Profile,
) {
  edge.profile = profile;
  edge.predict = 'search';
  edge.geocode = 'hit';
  const first = await runOnce(path, query, profile);
  const predicts = first.calls.predict
    ? PREDICT_OUTCOMES
    : (['search'] as const);
  const geocodes = first.calls.geocode ? GEOCODE_OUTCOMES : (['hit'] as const);
  const cases: Array<{ id: string; output: unknown }> = [];
  for (const p of predicts) {
    for (const g of geocodes) {
      edge.predict = p;
      edge.geocode = g;
      const r =
        p === 'search' && g === 'hit'
          ? first
          : await runOnce(path, query, profile);
      const id = [
        profile.id,
        first.calls.predict ? `predict=${p}` : '',
        first.calls.geocode ? `geocode=${g}` : '',
      ]
        .filter(Boolean)
        .join('|');
      cases.push({ id, output: r.out });
    }
  }
  return cases;
}
