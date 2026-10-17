// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Stubs for the edges of the search code: everything that would leave the process (Next.js runtime,
// Payload, Redis, ml-broker, the geocoder, Norse-API) is replaced, and nothing else. Search code itself
// runs unmodified. Each stub is driven by `edge`, which a case sets before it runs.
import { mock } from 'node:test';
import { Fragment, createElement, type ReactNode } from 'react';

export const API_URL = 'https://norse-api.test';
process.env.API_URL = API_URL;

export type PredictOutcome =
  | 'unavailable'
  | 'search'
  | 'search_and_notify_low_info'
  | 'search_and_notify_low_confidence'
  | 'clarify_multiple_labels'
  | 'clarify_low_info';
export const PREDICT_OUTCOMES: PredictOutcome[] = [
  'unavailable',
  'search',
  'search_and_notify_low_info',
  'search_and_notify_low_confidence',
  'clarify_multiple_labels',
  'clarify_low_info',
];
export type GeocodeOutcome = 'hit' | 'miss';
export const GEOCODE_OUTCOMES: GeocodeOutcome[] = ['hit', 'miss'];

export type Profile = {
  id: string;
  searchEngine: 'classic' | 'hybrid' | 'ai_classification';
  advancedGeo: boolean;
};
export const PROFILES: Profile[] = (
  ['classic', 'hybrid', 'ai_classification'] as const
).flatMap((searchEngine) =>
  [false, true].map((advancedGeo) => ({
    id: `${searchEngine}${advancedGeo ? '+geo' : ''}`,
    searchEngine,
    advancedGeo,
  })),
);

/** What the current case feeds the edges, and what the edges saw. */
export const edge = {
  profile: PROFILES[0],
  predict: 'search' as PredictOutcome,
  geocode: 'hit' as GeocodeOutcome,
  calls: { predict: 0, geocode: 0 },
  requests: [] as Array<{
    method: string;
    url: string;
    body?: unknown;
    headers: Record<string, string>;
  }>,
};

/** Browser-side state for client harnesses: the current URL, flags, and what the code did. */
export const client = {
  pathname: '/search',
  search: new URLSearchParams(),
  flags: {} as Record<string, boolean>,
  pushes: [] as string[],
  replaces: [] as string[],
  cookies: [] as Array<{ op: 'set' | 'delete'; name: string; value?: string }>,
  /** Handlers captured from stubbed UI primitives during a render, called afterwards with each input. */
  handlers: {} as Record<string, ((...args: never[]) => unknown) | undefined>,
  results: {
    sort: 'relevance',
    hasSearchCoordinates: false,
    filters: {} as Record<string, unknown>,
  },
  reset(pathname: string, query: string) {
    this.pathname = pathname;
    this.search = new URLSearchParams(query);
    this.pushes = [];
    this.replaces = [];
    this.cookies = [];
    this.handlers = {};
  },
  observed() {
    return {
      pushes: this.pushes,
      replaces: this.replaces,
      cookies: this.cookies,
    };
  },
};

export class RedirectSignal extends Error {
  constructor(public url: string) {
    super('NEXT_REDIRECT');
  }
}

function appConfig(profile: Profile) {
  return {
    tenantId: 'tenant-1',
    search: {
      searchEngine: profile.searchEngine,
      resultsLimit: 25,
      cardLayout: undefined,
      texts: {},
      radiusOptions: [],
      facets: [],
    },
    i18n: { locales: ['en', 'es'], defaultLocale: 'en' },
    meta: { title: 'Tenant Title', description: 'Tenant description' },
    brand: { name: 'Tenant', openGraphUrl: undefined },
    pages: {},
    featureFlags: { showAgeFilter: true },
    header: {},
    newLayout: { enabled: false },
  };
}

const PREDICT_RESPONSES: Record<
  Exclude<PredictOutcome, 'unavailable'>,
  unknown
> = {
  search: {
    scenario: 'search',
    hsis_taxonomies: ['BD-1800.2000'],
    options: [],
  },
  search_and_notify_low_info: {
    scenario: 'search_and_notify_low_info',
    hsis_taxonomies: ['BD-1800.2000'],
    options: [],
  },
  search_and_notify_low_confidence: {
    scenario: 'search_and_notify_low_confidence',
    hsis_taxonomies: ['BD-1800.2000', 'BH-1800.8500'],
    options: [],
  },
  clarify_multiple_labels: {
    scenario: 'clarify_multiple_labels',
    hsis_taxonomies: [],
    options: [
      {
        code: 'BD-1800.2000',
        score: 0.91,
        pre_selected: true,
        results_count: 12,
      },
      {
        code: 'BH-1800.8500',
        score: 0.62,
        pre_selected: false,
        results_count: 3,
      },
    ],
  },
  clarify_low_info: {
    scenario: 'clarify_low_info',
    hsis_taxonomies: [],
    options: [],
  },
};

const GEOCODE_HIT = [
  {
    coordinates: [-122.3, 47.6],
    place_type: ['place'],
    bbox: [-122.5, 47.4, -122.1, 47.8],
  },
];

/** Marker components: the page's client components are replaced so only the props they receive are observed. */
export const Marker = {
  PageWrapper: function PageWrapper(props: Record<string, unknown>) {
    return createElement(Fragment, null, props.children as ReactNode);
  },
  SearchResultsProvider: function SearchResultsProvider(
    props: Record<string, unknown>,
  ) {
    return createElement(Fragment, null, props.children as ReactNode);
  },
  SearchPageShell: function SearchPageShell() {
    return null;
  },
  ResultsEvents: function ResultsEvents() {
    return null;
  },
};

let installed = false;
export function installEdges(): void {
  if (installed) return;
  installed = true;
  const silent = {
    trace() {},
    debug() {},
    info() {},
    warn() {},
    error() {},
    fatal() {},
    child: () => silent,
  };

  mock.module('next/navigation', {
    namedExports: {
      redirect: (url: string) => {
        throw new RedirectSignal(url);
      },
      permanentRedirect: (url: string) => {
        throw new RedirectSignal(url);
      },
      notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
      },
      useRouter: () => ({
        push: (url: string) => client.pushes.push(url),
        replace: (url: string) => client.replaces.push(url),
        prefetch: () => undefined,
        back: () => undefined,
        refresh: () => undefined,
      }),
      useSearchParams: () => client.search,
      usePathname: () => client.pathname,
      useParams: () => ({}),
    },
  });
  // CommonJS package: its named exports are properties of the default export.
  mock.module('nextjs-toploader', {
    namedExports: {
      useTopLoader: () => ({ start() {}, done() {}, setProgress() {} }),
    },
  });
  mock.module('cookies-next/client', {
    namedExports: {
      setCookie: (name: string, value: string) =>
        client.cookies.push({ op: 'set', name, value: String(value) }),
      deleteCookie: (name: string) =>
        client.cookies.push({ op: 'delete', name }),
      getCookie: () => undefined,
      getCookies: () => ({}),
      hasCookie: () => false,
    },
  });
  mock.module('@/app/(app)/shared/hooks/use-app-config', {
    namedExports: {
      useAppConfig: () => ({
        ...appConfig(edge.profile),
        sessionId: 'session-1',
      }),
    },
  });
  mock.module('@/app/(app)/shared/hooks/use-flag', {
    namedExports: { useFlag: (name: string) => client.flags[name] ?? false },
  });
  mock.module('next/headers', {
    namedExports: {
      headers: async () => new Headers(),
      cookies: async () => ({
        get: () => undefined,
        getAll: () => [],
        has: () => false,
      }),
    },
  });
  mock.module('cookies-next/server', {
    namedExports: { getCookies: async () => ({}) },
  });
  mock.module('@/lib/logger', { namedExports: { createLogger: () => silent } });
  mock.module('@/lib/arcjet', {
    namedExports: { arcjetProtectPage: async () => undefined },
  });
  mock.module('@/utilities/withCache', {
    namedExports: {
      withCache: async (_key: unknown, fn: () => Promise<unknown>) => fn(),
      stableHash: (v: unknown) => JSON.stringify(v),
      ONE_MINUTE: 60,
      ONE_HOUR: 3600,
      ONE_DAY: 86400,
      ONE_MONTH: 2592000,
    },
  });
  mock.module('@/lib/api', {
    namedExports: {
      // Same shape as the real helper, minus the tenant API key (a Payload lookup).
      getApiHeaders: async (tenantId: string) => ({
        'x-api-version': '1',
        'x-tenant-id': tenantId,
      }),
    },
  });
  mock.module('@/app/(app)/shared/utils/appConfig', {
    namedExports: {
      getAppConfigWithoutHost: async () => appConfig(edge.profile),
    },
  });
  mock.module('@/app/(app)/shared/i18n/i18n', {
    defaultExport: async () => ({ resources: {}, t: (k: string) => k }),
  });
  mock.module('@/app/(app)/shared/services/ai-classification-search-service', {
    namedExports: {
      predictSearchNeeds: async () => {
        edge.calls.predict += 1;
        return edge.predict === 'unavailable'
          ? null
          : structuredClone(PREDICT_RESPONSES[edge.predict]);
      },
    },
  });
  mock.module('@/app/(app)/shared/serverActions/geocoding/forwardGeocode', {
    namedExports: {
      forwardGeocode: async () => {
        edge.calls.geocode += 1;
        return edge.geocode === 'hit' ? structuredClone(GEOCODE_HIT) : [];
      },
    },
  });
  mock.module('@/app/(app)/shared/components/page-wrapper', {
    namedExports: { PageWrapper: Marker.PageWrapper },
  });
  mock.module('@/app/(app)/features/search/context/search-results-context', {
    namedExports: {
      SearchResultsProvider: Marker.SearchResultsProvider,
      useSearchResults: () => client.results,
    },
  });
  // UI primitives that receive a URL-building handler: replaced by stubs that capture it.
  const pass = (props: { children?: ReactNode }) =>
    createElement(Fragment, null, props.children);
  const capture =
    (name: string, prop: string) => (props: Record<string, unknown>) => {
      client.handlers[name] = props[prop] as never;
      return createElement(Fragment, null, props.children as ReactNode);
    };
  mock.module('@/app/(app)/shared/components/ui/select', {
    namedExports: {
      Select: capture('select', 'onValueChange'),
      SelectContent: pass,
      SelectItem: pass,
      SelectTrigger: pass,
      SelectValue: pass,
      SelectGroup: pass,
      SelectLabel: pass,
    },
  });
  mock.module('@/app/(app)/shared/components/ui/input', {
    namedExports: { Input: capture('inputBlur', 'onBlur') },
  });
  mock.module('@/app/(app)/shared/components/language-switcher-primitive', {
    namedExports: {
      LanguageSwitcherPrimitive: capture('language', 'onValueChange'),
    },
  });
  mock.module('@/app/(app)/shared/components/search/search-location-actions', {
    namedExports: {
      SearchLocationActions: (props: {
        distanceSelectProps?: { onValueChange?: never };
      }) => {
        client.handlers.distance = props.distanceSelectProps?.onValueChange;
        return null;
      },
    },
  });
  mock.module(
    '@/app/(app)/shared/components/search/main-search-layout/main-search-layout',
    {
      namedExports: { MainSearchLayout: () => null },
    },
  );
  mock.module('@/app/(app)/shared/components/ui/sheet', {
    namedExports: {
      Sheet: pass,
      SheetContent: pass,
      SheetHeader: pass,
      SheetTitle: pass,
      SheetDescription: pass,
    },
  });
  mock.module('@/app/(app)/shared/components/ui/scroll-area', {
    namedExports: { ScrollArea: pass, ScrollBar: pass },
  });
  mock.module('@/app/(app)/shared/hooks/use-breakpoint', {
    namedExports: { useBreakpoint: () => true },
  });
  mock.module('@/app/(app)/features/search/components/search-page-shell', {
    namedExports: { SearchPageShell: Marker.SearchPageShell },
  });
  mock.module('@/app/(app)/features/search/components/results-events', {
    namedExports: { ResultsEvents: Marker.ResultsEvents },
  });

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    edge.requests.push({
      method: (init?.method ?? 'GET').toUpperCase(),
      url: url.startsWith(API_URL) ? url.slice(API_URL.length) : url,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
    });
    return new Response(
      JSON.stringify({
        search: { hits: { hits: [], total: { value: 0 } } },
        facets: [],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  }) as typeof fetch;
}
