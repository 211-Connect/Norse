// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Client-side builders. Each case renders the real component or hook once with react-dom/server (hooks
// run; effects don't), then calls the real handler it produced with each input, and records what the
// router and cookies received. Only browser edges and the UI primitive that holds the handler are stubbed.
import i18next from 'i18next';
import { getDefaultStore } from 'jotai';
import { createElement, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';

import { client, edge, PROFILES } from './edges';
import { localeFor, rawParamsFrom } from './server-page';
import type { Row } from './snapshots';

const ENGINES = PROFILES.filter((p) => !p.advancedGeo); // the browser code does not read the geo flag
const i18nFor = new Map<string, typeof i18next>();

function i18n(locale: string) {
  let inst = i18nFor.get(locale);
  if (!inst) {
    inst = i18next.createInstance();
    void inst.init({
      lng: locale,
      fallbackLng: 'en',
      resources: {},
      initAsync: false,
    });
    i18nFor.set(locale, inst);
  }
  return inst;
}

/** The browser's view of a row: pathname without the base path, and the locale it renders in. */
function browserView(row: Row) {
  const pathname = row.path.replace(/^\/adresources/, '') || '/';
  return { pathname, locale: localeFor(row.path) ?? 'en' };
}

function render(locale: string, node: ReactElement): string {
  return renderToString(
    createElement(I18nextProvider, { i18n: i18n(locale) }, node),
  );
}

/** Dialog state a visitor would have for a row: the row's own values, picked from a suggestion or typed. */
function dialogStates(query: string) {
  const p = new URLSearchParams(query);
  const coords = (p.get('coords') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const base = {
    queryLabel: p.get('query_label') ?? '',
    queryType: p.get('query_type') ?? '',
    organizationId: p.get('organization_id') ?? '',
    searchLocation: p.get('location') ?? '',
    searchCoordinates: p.get('coords') ? coords : [],
    searchDistance: p.get('distance') ?? '',
  };
  const text = p.get('query') ?? '';
  return [
    { id: 'picked', state: { ...base, query: text, searchTerm: text } },
    { id: 'typed', state: { ...base, query: '', searchTerm: text } },
  ];
}

/**
 * What `SearchResultsProvider` would hold for a row: the sort and origin the server page parses from the
 * URL, through the real parser, so a component that reads the current sort or whether coordinates exist
 * sees what the page would hand it, not a constant.
 */
async function providerValue(query: string) {
  const { parseSearchParams } =
    await import('../../../src/app/(app)/features/search/utils/parseSearchParams');
  const { isValidCoordinate } =
    await import('../../../src/utils/isValidCoordinate');
  const parsed = parseSearchParams(rawParamsFrom(query));
  return {
    sort: parsed.sort,
    hasSearchCoordinates: isValidCoordinate(parsed.coordinates ?? null),
    filters: {},
  };
}

async function setSearchAtom(state: Record<string, unknown>) {
  const { DEFAULT_SEARCH_STATE, searchAtom } =
    await import('../../../src/app/(app)/shared/store/search');
  getDefaultStore().set(searchAtom, {
    ...DEFAULT_SEARCH_STATE,
    ...state,
  } as never);
}

// ------------------------------------------------------------------ paths 1, 2a, 2b, 2c: dialog submit
export async function* dialogCases(corpus: Row[]) {
  const { useNavigateClassicSearch } =
    await import('../../../src/app/(app)/features/search/hooks/useNavigateClassicSearch');
  const { useNavigateAiSearch } =
    await import('../../../src/app/(app)/features/search/hooks/useNavigateAiSearch');
  let classic:
    ((payload: Record<string, unknown>) => Promise<void>) | undefined;
  let ai:
    | ((args?: { scenario?: string; taxonomies?: string[] }) => boolean)
    | undefined;
  const now = (cb: () => void) => cb();
  function Probe() {
    classic = useNavigateClassicSearch({ startTransition: now });
    ai = useNavigateAiSearch({ startTransition: now }) as never;
    return null;
  }
  const actions: Array<[string, () => unknown]> = [
    ['classic', () => classic!({})],
    [
      'ai-search',
      () => ai!({ scenario: 'search', taxonomies: ['BD-1800.2000'] }),
    ],
    [
      'ai-notify-low-info',
      () =>
        ai!({
          scenario: 'search_and_notify_low_info',
          taxonomies: ['BD-1800.2000'],
        }),
    ],
    [
      'ai-notify-low-confidence',
      () =>
        ai!({
          scenario: 'search_and_notify_low_confidence',
          taxonomies: ['BD-1800.2000', 'BH-1800.8500'],
        }),
    ],
    ['clarify-skip', () => ai!()],
    ['clarify-confirm', () => ai!({ taxonomies: ['BH-1800.8500'] })],
  ];
  for (const row of corpus) {
    const { pathname, locale } = browserView(row);
    for (const profile of ENGINES) {
      for (const d of dialogStates(row.query)) {
        for (const [action, run] of actions) {
          edge.profile = profile;
          client.reset(pathname, row.query);
          await setSearchAtom(d.state);
          render(locale, createElement(Probe));
          const returned = await run();
          yield {
            case: `${row.scenario}|${profile.searchEngine}|${d.id}|${action}`,
            output: { returned: returned ?? null, ...client.observed() },
          };
        }
      }
    }
  }
}

// ------------------------------------------------------------------ paths 7a, 7b: filter toggle and clear
export async function* filterCases(corpus: Row[]) {
  const { useFilterActions } =
    await import('../../../src/app/(app)/features/search/components/filter/use-filter-actions');
  let actions: ReturnType<typeof useFilterActions> | undefined;
  function Probe() {
    actions = useFilterActions();
    return null;
  }
  for (const row of corpus) {
    const { pathname, locale } = browserView(row);
    const run = (
      label: string,
      fn: (a: NonNullable<typeof actions>) => void,
    ) => {
      client.reset(pathname, row.query);
      render(locale, createElement(Probe));
      const active = actions!.activeFilters;
      fn(actions!);
      return {
        case: `${row.scenario}|${label}`,
        output: { active, ...client.observed() },
      };
    };
    yield run('toggle-on-new', (a) =>
      a.toggleFilter('synthetic_facet', 'synthetic value', true),
    );
    yield run('toggle-off-first', (a) => {
      const [key] = Object.keys(a.activeFilters);
      const first = key
        ? ([] as unknown[]).concat(a.activeFilters[key] as never)[0]
        : undefined;
      a.toggleFilter(
        key ?? 'synthetic_facet',
        String(first ?? 'synthetic value'),
        false,
      );
    });
    yield run('toggle-on-first-again', (a) => {
      const [key] = Object.keys(a.activeFilters);
      const first = key
        ? ([] as unknown[]).concat(a.activeFilters[key] as never)[0]
        : undefined;
      a.toggleFilter(
        key ?? 'synthetic_facet',
        String(first ?? 'synthetic value'),
        true,
      );
    });
    yield run('clear', (a) => a.applyFilters());
  }
}

// ------------------------------------------------------------------ paths 7c, 7d: age and distance (FilterPanel)
export async function* panelCases(corpus: Row[]) {
  const { FilterPanel } =
    await import('../../../src/app/(app)/features/search/components/filter/filter-panel');
  const AGES = ['', '0', '5', '-3', '250', 'abc', '12.7'];
  const DISTANCES = ['0', '10', '25'];
  for (const row of corpus) {
    const { pathname, locale } = browserView(row);
    const results = await providerValue(row.query);
    const renderPanel = async () => {
      client.reset(pathname, row.query);
      client.results = results;
      await setSearchAtom({
        searchCoordinates: results.hasSearchCoordinates ? [-122.3, 47.6] : [],
      });
      render(
        locale,
        createElement(FilterPanel, {
          onLegacyAiClarifyAction: () => undefined,
        }),
      );
    };
    for (const age of AGES) {
      await renderPanel();
      const blur = client.handlers.inputBlur as
        ((e: unknown) => void) | undefined;
      if (blur) blur({ currentTarget: { value: age } });
      yield {
        case: `${row.scenario}|age=${age}`,
        output: { control: Boolean(blur), ...client.observed() },
      };
    }
    for (const distance of DISTANCES) {
      await renderPanel();
      const change = client.handlers.distance as
        ((v: string) => void) | undefined;
      if (change) change(distance);
      yield {
        case: `${row.scenario}|distance=${distance}`,
        output: { control: Boolean(change), ...client.observed() },
      };
    }
  }
}

// ------------------------------------------------------------------ path 8: sort
export async function* sortCases(corpus: Row[]) {
  const { SortSelect } =
    await import('../../../src/app/(app)/features/search/components/sort-select');
  for (const row of corpus) {
    const { pathname, locale } = browserView(row);
    const results = await providerValue(row.query);
    for (const value of ['relevance', 'name', 'organization', 'distance']) {
      client.reset(pathname, row.query);
      client.results = results;
      render(locale, createElement(SortSelect));
      (client.handlers.select as (v: string) => void)(value);
      yield {
        case: `${row.scenario}|sort=${value}`,
        output: client.observed(),
      };
    }
  }
}

// ------------------------------------------------------------------ path 9: pagination links
export async function* paginationCases(corpus: Row[]) {
  const { CustomPagination } =
    await import('../../../src/app/(app)/shared/components/custom-pagination');
  for (const row of corpus) {
    const { pathname, locale } = browserView(row);
    client.reset(pathname, row.query);
    const html = render(
      locale,
      createElement(CustomPagination, {
        total: 12,
        siblings: 1,
        boundaries: 1,
        activePage: 5,
        totalResults: 300,
      }),
    );
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) =>
      m[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>'),
    );
    yield { case: row.scenario, output: { hrefs } };
  }
}

// ------------------------------------------------------------------ path 10: language switch
export async function* languageCases(corpus: Row[]) {
  const { LanguageSwitcher } =
    await import('../../../src/app/(app)/shared/components/language-switcher');
  for (const row of corpus) {
    const { pathname, locale } = browserView(row);
    for (const target of ['en', 'es']) {
      client.reset(pathname, row.query);
      render(locale, createElement(LanguageSwitcher));
      const change = client.handlers.language as
        ((v: string) => void) | undefined;
      if (change) change(target);
      yield {
        case: `${row.scenario}|to=${target}`,
        output: { control: Boolean(change), ...client.observed() },
      };
    }
  }
}
