// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Paths that replay or wrap a search URL rather than build one:
//   18  back to results: the previous URL is captured on the search page and replayed by the button
//   21  external widget config: the API that hands topics and the tenant domain to outside widgets
//   25  share links: the stored URL is followed, unless the tenant's login wall applies
//   26  resource 404s: the API's redirect path is followed under the current locale
import { createElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

import { closeDom, withDom } from './dom';
import { client, edge, RedirectSignal } from './edges';
import type { Row } from './snapshots';

const i18n = i18next.createInstance();
void i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {},
  initAsync: false,
});
const urlOf = (row: Row) =>
  `${row.path.replace(/^\/adresources/, '')}${row.query ? `?${row.query}` : ''}`;

// ------------------------------------------------------------------ 18: back to results
export async function* backToResultsCases(corpus: Row[]) {
  const { PrevUrlProvider } =
    await import('../../../src/app/(app)/shared/context/prev-url-provider');
  const { BackToResultsButton } =
    await import('../../../src/app/(app)/features/resource/components/back-to-results-button');
  for (const row of corpus) {
    const pathname = row.path.replace(/^\/adresources/, '') || '/';
    client.reset(pathname, row.query);
    const output = await withDom(
      `https://tenant.test${row.path}`,
      async (mount) => {
        const tree = () =>
          createElement(
            I18nextProvider,
            { i18n },
            createElement(
              PrevUrlProvider,
              null,
              createElement(BackToResultsButton),
            ),
          );
        const page = await mount(tree());
        // Navigate from the search URL to a resource page, as clicking a result does.
        client.pathname = pathname.replace(
          /\/search\/?$/,
          '/search/resource-1',
        );
        client.search = new URLSearchParams();
        await page.rerender(tree());
        const link = page.querySelector('a');
        return {
          back: link?.getAttribute('href') ?? null,
          cookies: client.cookies,
        };
      },
    );
    yield { case: row.scenario, output };
  }
  await closeDom();
}

// ------------------------------------------------------------------ 21: widget config API
export async function* widgetConfigCases(corpus: Row[]) {
  const { GET } =
    await import('../../../src/app/(app)/api/search-config/[tenantId]/[locale]/route');
  const { NextRequest } = await import('next/server');
  for (const row of corpus) {
    const p = new URLSearchParams(row.query);
    // Shaped like the Payload resource directory the route reads.
    edge.resourceDirectory = {
      tenant: { trustedDomains: [{ domain: 'tenant.test' }] },
      brand: { theme: { primaryColor: '#000000', borderRadius: 4 } },
      search: {
        texts: {},
        searchSettings: {
          resultsLimit: 25,
          radiusSelectValues: [{ value: 10 }],
          defaultRadius: 10,
          searchEngine: 'classic',
        },
      },
      suggestions: [],
      topics: {
        list: [
          {
            name: 'topic',
            subtopics: [
              {
                name: p.get('query_label') || 'label',
                query: p.get('query') ?? '',
                queryType: p.get('query_type') || undefined,
              },
              { name: 'cms', query: '', href: urlOf(row), openInNewTab: true },
            ],
          },
        ],
      },
    };
    for (const locale of ['en', 'es']) {
      const res = await GET(
        new NextRequest(
          `https://tenant.test/api/search-config/tenant-1/${locale}`,
        ),
        {
          params: Promise.resolve({ tenantId: 'tenant-1', locale }),
        },
      );
      yield {
        case: `${row.scenario}|${locale}`,
        output: { status: res.status, body: await res.json() },
      };
    }
  }
}

// ------------------------------------------------------------------ 25: share links
const SHARE_TENANTS = {
  open: { auth: { requiresLogin: false } },
  'login-no-session': { auth: { requiresLogin: true, publicPages: [] } },
  'login-session': { auth: { requiresLogin: true, publicPages: [] } },
  'login-search-public': {
    auth: { requiresLogin: true, publicPages: ['search'] },
  },
};
export async function* shareCases(corpus: Row[]) {
  const page =
    await import('../../../src/app/(app)/[locale]/share/[shortCode]/page');
  const route =
    await import('../../../src/app/(app)/api/share/[tenantId]/[id]/route');
  for (const row of corpus) {
    // The share button stores window.location.href: absolute, with the visitor's origin.
    const stored = `https://tenant.test${row.path}${row.query ? `?${row.query}` : ''}`;
    for (const [tenantId, tenant] of Object.entries(SHARE_TENANTS)) {
      edge.shortUrl = stored;
      edge.tenant = tenant;
      edge.serverSession =
        tenantId === 'login-session' ? { user: { id: 'u-1' } } : null;
      let redirect: string | null = null;
      try {
        await page.default({
          params: Promise.resolve({ locale: 'en', shortCode: 'abc123' }),
        } as never);
      } catch (e) {
        if (e instanceof RedirectSignal) redirect = e.url;
        else redirect = `error: ${(e as Error).message}`;
      }
      yield { case: `${row.scenario}|page|${tenantId}`, output: { redirect } };
    }
    edge.shortUrl = stored;
    const res = await route.GET(
      new Request('https://tenant.test/api/share/tenant-1/abc123'),
      {
        params: Promise.resolve({ id: 'abc123', tenantId: 'tenant-1' }),
      },
    );
    yield {
      case: `${row.scenario}|legacy-route`,
      output: { status: res.status, location: res.headers.get('location') },
    };
  }
}

// ------------------------------------------------------------------ 26: resource 404 redirects
export async function* resource404Cases(corpus: Row[]) {
  const { FetchError } =
    await import('../../../src/app/(app)/shared/lib/fetchError');
  const byId =
    await import('../../../src/app/(app)/[locale]/(rest)/search/[id]/page');
  const byOriginal =
    await import('../../../src/app/(app)/[locale]/(rest)/details/original/[original_id]/page');
  for (const row of corpus) {
    edge.resourceError = new FetchError({
      url: '/resource',
      status: 404,
      statusText: 'Not Found',
      data: { redirect: urlOf(row) },
    });
    for (const locale of ['en', 'es']) {
      for (const [name, run] of [
        [
          'search/[id]',
          () =>
            byId.default({
              params: Promise.resolve({
                id: '00000000-0000-0000-0000-000000000000',
                locale,
              }),
            } as never),
        ],
        [
          'details/original',
          () =>
            byOriginal.default({
              params: Promise.resolve({ original_id: 'orig-1', locale }),
            } as never),
        ],
      ] as const) {
        let redirect: string | null = null;
        try {
          await run();
        } catch (e) {
          redirect =
            e instanceof RedirectSignal
              ? e.url
              : `error: ${(e as Error).message}`;
        }
        yield {
          case: `${row.scenario}|${locale}|${name}`,
          output: { redirect },
        };
      }
    }
  }
}
