// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// The whole request proxy (src/proxy.ts) for every scenario: login wall (BUILDERS 23), the cookie
// middleware it calls (22), and locale routing (24). This is also what decides doubled-locale and other
// paths that never reach the search page. Only tenant config and the session lookup are stubbed (they are
// HTTP calls back into Norse); per-request randomness (nonce, session id, CSP) is left out of the output.
import { edge } from './edges';
import type { Row } from './snapshots';

type Tenant = {
  id: string;
  locales: string[];
  requiresLogin: boolean;
  publicPages: string[];
  session: boolean;
};
const TENANTS: Tenant[] = [
  {
    id: 'open',
    locales: ['en', 'es'],
    requiresLogin: false,
    publicPages: [],
    session: false,
  },
  {
    id: 'en-only',
    locales: ['en'],
    requiresLogin: false,
    publicPages: [],
    session: false,
  },
  {
    id: 'login-no-session',
    locales: ['en', 'es'],
    requiresLogin: true,
    publicPages: [],
    session: false,
  },
  {
    id: 'login-session',
    locales: ['en', 'es'],
    requiresLogin: true,
    publicPages: [],
    session: true,
  },
  {
    id: 'login-search-public',
    locales: ['en', 'es'],
    requiresLogin: true,
    publicPages: ['search'],
    session: false,
  },
];
const ACCEPT_LANGUAGE = ['', 'es'];

process.env.NEXT_PUBLIC_LOG_LEVEL = 'fatal'; // the proxy's own logger; read when the module loads

export async function* proxyCases(corpus: Row[]) {
  const { NextRequest } = await import('next/server');
  const { proxy } = await import('../../../src/proxy');
  for (const row of corpus) {
    const basePath = row.path.startsWith('/adresources') ? '/adresources' : '';
    for (const tenant of TENANTS) {
      for (const lang of ACCEPT_LANGUAGE) {
        if (basePath) process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH = basePath;
        else delete process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH;
        edge.tenantBasic = {
          enabledLocales: tenant.locales,
          defaultLocale: 'en',
          auth: {
            requiresLogin: tenant.requiresLogin,
            allowedEmailDomains: [],
            publicPages: tenant.publicPages,
          },
          seo: { noindex: false },
        };
        edge.session = tenant.session ? { user: { id: 'u-1' } } : {};
        // The proxy caches tenant config per host, so each tenant variant gets its own host.
        const host = `${tenant.id}${basePath ? '-bp' : ''}.tenant.test`;
        const origin = `https://${host}`;
        const req = new NextRequest(
          `${origin}${row.path}${row.query ? `?${row.query}` : ''}`,
          {
            headers: { host, ...(lang ? { 'accept-language': lang } : {}) },
            nextConfig: basePath
              ? { basePath, trailingSlash: true }
              : undefined,
          },
        );
        const res = await proxy(req);
        const strip = (v: string | null) =>
          v && v.startsWith(origin) ? v.slice(origin.length) : v;
        const cookies = (res.headers.getSetCookie?.() ?? [])
          .map((c) => c.split(';')[0])
          .filter(
            (c) =>
              !/^(session[-_]?id|sid)=/i.test(c) && !c.startsWith('session'),
          );
        yield {
          case: `${row.scenario}|${tenant.id}|lang=${lang || 'none'}`,
          output: {
            status: res.status,
            location: strip(res.headers.get('location')),
            rewrite: strip(res.headers.get('x-middleware-rewrite')),
            next: res.headers.get('x-middleware-next'),
            cookies,
          },
        };
      }
    }
  }
}
