// Prototype only. Fake CMS + fake Norse-API on :4100, so the public app runs with no database and no real data.
import http from 'node:http';
import {
  classifySune,
  labelOf,
} from '../src/app/(app)/features/search/sune-demo/sune.mjs';
// Round 17: run with `npx tsx prototype/stub-backend.mjs`. `/v2/search` and `/search` share one real classify + rules pass.
import { readParams, v2Search } from './v2-search.ts';
import { upstreamV2Url } from './v2-upstream.ts';
const svc = (s, i) => {
  const id = s.id;
  const lat = 48.72 + (i % 7) * 0.01,
    lon = -122.52 + (i % 5) * 0.02;
  return {
    _id: id,
    _source: {
      service_at_location_id: 'sal-' + id,
      name: s.org,
      priority: 0,
      phone: '(555) 010-' + id.padStart(4, '0'),
      url: 'https://example.org/' + id,
      service: {
        name: s.name,
        summary: s.summary,
        description:
          s.summary + ' This is synthetic sample data for a design prototype.',
        eligibility: s.who,
        application_process: 'Call to apply.',
      },
      organization: { alternate_name: s.org },
      attribution: 'Sample Data Collaborative',
      location: {
        name: s.org,
        point: { type: 'Point', coordinates: [lon, lat] },
        physical_address: {
          address_1: id + '00 Main St',
          city: 'Sampleton',
          state: 'WA',
          postal_code: '98000',
        },
      },
      taxonomies: s.needs.map((code) => ({ code, name: labelOf(code) })),
      schedule: 'Mon-Fri 9:00 AM-5:00 PM',
    },
  };
};
// Always refine: predict never stops the user. U-0 stays out: predict's codes land in the URL. It returns SUNE codes where the real one returns HSIS codes.
const predict = (q) => ({
  scenario: 'search',
  hsis_taxonomies: classifySune(q).codes.filter((code) => code !== 'U-0'),
  options: [],
});
const appConfig = {
  accessibility: { fontSize: { allowedValues: ['100%', '125%'] } },
  brand: {
    name: 'Sample County Resources',
    theme: {
      primaryColor: '#0D6C68',
      secondaryColor: '#7DBFA7',
      borderRadius: '16px',
    },
  },
  contact: { number: '211' },
  sms: null,
  featureFlags: {
    enablePrintableDirectories: false,
    enableOrganizationSearch: false,
    // The tenant's v2 switch (Payload enableV2Api, super-admin only, default off). The demo defaults on.
    enableV2Api: process.env.STUB_V2_API !== '0',
    requireUserLocation: process.env.STUB_REQUIRE_LOCATION === '1',
    showAgeFilter: false,
    showFeedbackButtonGlobal: false,
    showFeedbackButtonOnResourcePages: false,
    showHomePageTour: false,
    showPrintButton: true,
    showSearchAndResourceServiceName: true,
    showSuggestionListTaxonomyBadge: process.env.STUB_BADGE === '1',
    showOrganizationLocationBadge: false,
    showUseMyLocationButtonOnDesktop: true,
    turnResourceCardTaxonomiesIntoLinks: false,
    requireAuthenticationForFavorites: false,
  },
  printableDirectories: {
    accessMode: 'everyone',
    allowedEmails: [],
    allowedDomains: [],
    userGroups: [],
  },
  footer: { customMenu: [], copyright: 'Synthetic prototype data' },
  header: {
    customMenu: [
      { name: 'Events', href: '#' },
      { name: 'About Us', href: '#' },
    ],
    position: 'static',
    safeExit: {
      enabled: true,
      text: 'Quick exit',
      url: 'https://www.weather.gov',
      target: '_self',
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  meta: { description: 'Prototype', title: 'Sample County Resources' },
  pages: {
    accessibilityPage: { enabled: false },
    privacyPolicyPage: { enabled: false },
    termsOfUsePage: { enabled: false },
  },
  resource: { layout: { leftColumn: [], rightColumn: [] } },
  search: {
    facets: [],
    map: { center: [-122.48, 48.75], zoom: 10 },
    radiusOptions: [{ value: 10 }, { value: 25 }],
    defaultRadius: 0,
    searchEngine: 'ai_classification',
    resultsLimit: 25,
    pinnedResourcesMode: 'ignore',
    showAllResultsOnMap: process.env.STUB_SHOW_ALL_MAP === '1',
    texts:
      process.env.STUB_BLANK_TEXTS === '1'
        ? {}
        : {
            title: 'How can we help?',
            queryInputPlaceholder: 'Describe how you need help',
          },
  },
  badges: [],
  suggestions: [
    'Getting Enough Food',
    'A Place to Sleep Tonight',
    'Money for Basic Needs',
    'Getting Around',
    'Child Care or Adult Day Care',
  ].map((value) => ({ value, taxonomies: 'BD' })),
  tenantId: '00000000-0000-4000-8000-000000000001',
  topics: {
    iconSize: 'small',
    list: [
      ['Care', ['Child Care', 'Support Networks']],
      ['Emergency', ['Domestic Violence', 'Help Hotlines']],
      ['Food', ['Food Banks', 'Meal Programs']],
      ['Housing', ['Shelter', 'Help Pay for Housing']],
      ['Money', ['Financial Assistance']],
      ['Health', ['Medical', 'Dental']],
    ].map(([name, s]) => ({
      name,
      subtopics: s.map((n) => ({ name: n, queryType: 'text', query: n })),
    })),
  },
};
// Live demo: name and map follow the real tenant when V2_UPSTREAM is set.
if (process.env.V2_UPSTREAM) {
  appConfig.brand.name = process.env.V2_BRAND ?? 'Live tenant data';
  appConfig.meta.title = appConfig.brand.name;
  appConfig.footer.copyright =
    'Live results from a real tenant index (prototype)';
  if (process.env.V2_COORDS)
    appConfig.search.map.center = process.env.V2_COORDS.split(',').map(Number);
}
const basic = {
  enabledLocales: ['en'],
  defaultLocale: 'en',
  auth: { requiresLogin: false, allowedEmailDomains: [], publicPages: [] },
  seo: { noindex: true },
};
const style = {
  version: 8,
  sources: {},
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#dfeaf2' } },
  ],
};
http
  .createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const u = new URL(req.url, 'http://x');
      const p = u.pathname.replace(/\/$/, '');
      const q = u.searchParams.get('query') || u.searchParams.get('q') || '';
      const send = (o) => {
        res.writeHead(200, {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        });
        res.end(JSON.stringify(o));
      };
      console.log(req.method, p, q.slice(0, 40));
      // PR #331: on v2, tenant and language are in the URL only. Log what arrived so a run can check it.
      if (p === '/v2/search')
        console.log(
          '  v2 tenant_id=%s locale=%s x-tenant-id=%s accept-language=%s',
          u.searchParams.get('tenant_id'),
          u.searchParams.get('locale'),
          req.headers['x-tenant-id'] ?? '(none)',
          req.headers['accept-language'] ?? '(none)',
        );
      if (p === '/style.json') return send(style);
      if (p === '/api/internal/app-config') return send(appConfig);
      if (p === '/api/getTenantBasicConfig') return send(basic);
      // Live mode: the v1 predict gate must not add need codes from the fake classifier to the URL;
      // the real /v2/search classifies (known gap (a), ISS-2348).
      if (p === '/search/predict')
        return send(
          process.env.V2_UPSTREAM
            ? { scenario: 'search', hsis_taxonomies: [], options: [] }
            : predict(q),
        );
      if (p === '/search/re-rank')
        return send({ hsis_taxonomies: ['BD-5000'] });
      if (p === '/suggestion')
        return send({ taxonomies: [], organizations: [] });
      // The v2 shape: v1 hits plus `matched_needs` on each hit when needs were sent (ADR 0039 Decision 56).
      // Decision 43: the route rejects needs=N-X with 400.
      // Real backend (2026-11-16 standup demo): V2_UPSTREAM=http://127.0.0.1:8091 V2_TENANT=<tenant uuid> forwards
      // /v2/search and /search to a local Norse-API v2 build, which reads the real Elasticsearch index of that tenant.
      if (process.env.V2_UPSTREAM && p.startsWith('/geocoding/')) {
        // Dev-only proxy: the forwarded URL must stay on the configured upstream origin and keep a plain /geocoding/ path.
        const upstream = new URL(process.env.V2_UPSTREAM);
        const target = new URL(
          upstream.origin +
            '/geocoding/' +
            encodeURIComponent(p.slice('/geocoding/'.length)).replace(
              /%2F/gi,
              '/',
            ),
        );
        target.search = u.search;
        if (
          target.origin !== upstream.origin ||
          target.pathname.includes('..')
        ) {
          res.writeHead(400);
          return void res.end();
        }
        return void fetch(target, {
          headers: {
            'x-tenant-id': process.env.V2_TENANT,
            'accept-language': 'en',
          },
        })
          .then(async (r) => {
            const text = await r.text();
            console.log('  geocode', r.status);
            res.writeHead(r.status, { 'content-type': 'application/json' });
            res.end(text);
          })
          .catch((err) => {
            console.error(err);
            res.writeHead(502);
            res.end();
          });
      }
      // PR #330: `GET /v2/search/pins`, the located matches of the same search as the list, no paging.
      // The pin shape is the contract's: id (= hit _id), service_at_location_id, name, physical_address, coordinates [lon, lat].
      // Needs never filter, so they do not change the set. The synthetic catalog has no regions or filters, so those are not honoured.
      if (p === '/v2/search/pins') {
        console.log(
          '  pins tenant_id=%s locale=%s x-tenant-id=%s x-api-version=%s',
          u.searchParams.get('tenant_id'),
          u.searchParams.get('locale'),
          req.headers['x-tenant-id'] ?? '(none)',
          req.headers['x-api-version'] ?? '(none)',
        );
        if (process.env.V2_UPSTREAM) {
          const up = new URL('/v2/search/pins', process.env.V2_UPSTREAM);
          for (const [k, v] of u.searchParams) up.searchParams.set(k, v);
          up.searchParams.set('tenant_id', process.env.V2_TENANT);
          if (process.env.V2_COORDS && !up.searchParams.get('coords'))
            up.searchParams.set('coords', process.env.V2_COORDS);
          up.searchParams.set(
            'relevance_cutoff',
            process.env.V2_CUTOFF === 'on' ? 'on' : 'off',
          );
          return void fetch(up)
            .then(async (r) => {
              const text = await r.text();
              console.log('  upstream pins', r.status, text.length);
              res.writeHead(r.status, {
                'content-type': 'application/json',
                'access-control-allow-origin': '*',
              });
              res.end(text);
            })
            .catch((err) => {
              console.error(err);
              res.writeHead(502);
              res.end();
            });
        }
        const wp = readParams(u.searchParams);
        if (/zzqx/i.test(wp.other || wp.query) && wp.needs.length === 0)
          return send({ total: 0, truncated: false, pins: [] });
        return void v2Search(wp).then(
          ({ services }) => {
            const pins = services.map((s, i) => {
              const h = svc(s, i);
              return {
                id: h._id,
                service_at_location_id: h._source.service_at_location_id,
                name: h._source.name,
                physical_address: h._source.location.physical_address,
                coordinates: h._source.location.point.coordinates,
              };
            });
            send({ total: pins.length, truncated: false, pins });
          },
          (err) => {
            console.error(err);
            res.writeHead(500);
            res.end();
          },
        );
      }
      if (process.env.V2_UPSTREAM && (p === '/v2/search' || p === '/search')) {
        // The URL building (tenant, locale, needs, coords, the relevance cut, and every other v2 parameter
        // such as sort) is in `v2-upstream.ts`.
        const up = upstreamV2Url(u.searchParams, {
          upstream: process.env.V2_UPSTREAM,
          tenant: process.env.V2_TENANT,
          coords: process.env.V2_COORDS,
          cutoff: process.env.V2_CUTOFF,
        });
        return void fetch(up)
          .then(async (r) => {
            let text = await r.text();
            console.log('  upstream', r.status, text.length);
            // No hit carries any need: the live index has no need tags yet (dagster PR #780), so
            // matched_needs is "not checked", not "none". Drop it so the page shows no false notice.
            try {
              const d = JSON.parse(text);
              const hits = d?.search?.hits?.hits ?? [];
              if (hits.length && hits.every((h) => !h.matched_needs?.length)) {
                for (const h of hits) delete h.matched_needs;
                text = JSON.stringify(d);
              }
            } catch {}
            res.writeHead(r.status, {
              'content-type': 'application/json',
              'access-control-allow-origin': '*',
            });
            res.end(text);
          })
          .catch((err) => {
            console.error(err);
            res.writeHead(502);
            res.end();
          });
      }
      if (
        p === '/v2/search' &&
        readParams(u.searchParams).needs.includes('N-X')
      ) {
        res.writeHead(400, { 'content-type': 'application/json' });
        return void res.end(
          JSON.stringify({ error: 'needs=N-X is not allowed' }),
        );
      }
      // Weak match (Norse-API ISS-2796): a query with "zzqx" (nonsense) finds nothing good, unless Other text without it joined the query. With no needs the
      // results are empty and the one no_match question asks what the person needs; Other text that is not
      // nonsense joins the query and searches normally; a Tier 1 pick drops the text (needs only).
      if (p === '/v2/search' && !process.env.V2_UPSTREAM) {
        const wp = readParams(u.searchParams);
        const weak =
          /zzqx/i.test(wp.query) &&
          wp.query.split('. ').every((part) => /zzqx/i.test(part));
        if (weak && wp.needs.length === 0) {
          const opts = ['N-FOD', 'N-HOU', 'N-MON']
            .filter((c) => !wp.passedNeeds.includes(c))
            .map((c) => ({
              label: labelOf(c) || c,
              parameter: 'needs',
              value: c,
            }));
          return send({
            search: { hits: { total: { value: 0, relation: 'eq' }, hits: [] } },
            facets: {},
            weak_match: true,
            intent: {
              query: wp.query || null,
              needs: [],
              urgency: { value: 'U-X', source: 'inferred', state: 'drop' },
            },
            clarification: {
              rules_version: 'stub',
              questions:
                wp.clarify === 'never'
                  ? []
                  : [
                      {
                        id: 'no_match',
                        type: 'find_need',
                        importance: 'high',
                        value: 1,
                        priority: 1,
                        uncertainty: 1,
                        reason: 'weak_match',
                        step: 2,
                        stem: 'We could not find a good match. What do you need help with?',
                        options: opts,
                        multi_select: true,
                        allow_other: true,
                        none_of_these: true,
                      },
                    ],
            },
            model_version: null,
            rules_version: 'stub',
            prototype: {
              services: 'synthetic catalog',
              classifier: 'stub weak match',
              timing_ms: { classify: 0, total: 0 },
            },
          });
        }
        if (weak) {
          u.searchParams.delete('query');
          u.searchParams.delete('q');
        }
        var weakPick = weak;
      }
      if (p === '/v2/search')
        return void v2Search(readParams(u.searchParams)).then(
          ({ services, body }) => {
            const sent = readParams(u.searchParams).needs.length > 0;
            const page = Math.max(1, Number(u.searchParams.get('page')) || 1);
            const hits = services
              .slice((page - 1) * 25, page * 25)
              .map((s, i) => ({
                ...svc(s, i),
                ...(sent ? { matched_needs: s.matchedNeeds } : {}),
              }));
            send({
              search: {
                hits: {
                  total: { value: services.length, relation: 'eq' },
                  hits,
                },
              },
              weak_match: Boolean(weakPick),
              ...body,
            });
          },
          (err) => {
            console.error(err);
            res.writeHead(err.status ?? 500, {
              'content-type': 'application/json',
            });
            res.end(JSON.stringify({ error: err.message }));
          },
        );
      if (p === '/search')
        return void v2Search(readParams(u.searchParams)).then(
          ({ services, body }) => {
            const hits = services.map(svc);
            send({
              search: { hits: { total: { value: hits.length }, hits } },
              facets: body.facets,
              ...(body.resolved_location && {
                resolved_location: body.resolved_location,
              }),
            });
          },
          (err) => {
            console.error(err);
            res.writeHead(err.status ?? 500);
            res.end();
          },
        );
      send(null);
    });
  })
  .listen(Number(process.env.STUB_PORT ?? 4100), () =>
    console.log(`stub on ${process.env.STUB_PORT ?? 4100}`),
  );
