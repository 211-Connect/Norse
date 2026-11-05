// Prototype only. Fake CMS + fake Norse-API on :4100, so the public app runs with no database and no real data.
import http from 'node:http';
import { classifySune, labelOf, matchServices } from '../src/app/(app)/features/search/sune-demo/sune.mjs';
const svc = (s, i) => { const id = s.id; const lat = 48.72 + (i % 7) * 0.01, lon = -122.52 + (i % 5) * 0.02; return { _id: id, _source: {
  service_at_location_id: 'sal-' + id, name: s.org, priority: 0, phone: '(555) 010-' + id.padStart(4, '0'), url: 'https://example.org/' + id,
  service: { name: s.name, summary: s.summary, description: s.summary + ' This is synthetic sample data for a design prototype.', eligibility: s.who, application_process: 'Call to apply.' },
  organization: { alternate_name: s.org }, attribution: 'Sample Data Collaborative',
  location: { name: s.org, point: { type: 'Point', coordinates: [lon, lat] }, physical_address: { address_1: id + '00 Main St', city: 'Sampleton', state: 'WA', postal_code: '98000' } },
  taxonomies: s.needs.map((code) => ({ code, name: labelOf(code) })), schedule: 'Mon-Fri 9:00 AM-5:00 PM' } }; };
// Always refine: predict never stops the user. It returns SUNE codes where the real one returns HSIS codes.
const predict = (q) => ({ scenario: 'search', hsis_taxonomies: classifySune(q).codes, options: [] });
const appConfig = {
  accessibility: { fontSize: { allowedValues: ['100%', '125%'] } },
  brand: { name: 'Sample County Resources', theme: { primaryColor: '#0D6C68', secondaryColor: '#7DBFA7', borderRadius: '16px' } },
  contact: { number: '211' }, sms: null,
  featureFlags: { enablePrintableDirectories: false, enableOrganizationSearch: false, requireUserLocation: process.env.STUB_REQUIRE_LOCATION === '1', showAgeFilter: false, showFeedbackButtonGlobal: false, showFeedbackButtonOnResourcePages: false, showHomePageTour: false, showPrintButton: true, showSearchAndResourceServiceName: true, showSuggestionListTaxonomyBadge: false, showOrganizationLocationBadge: false, showUseMyLocationButtonOnDesktop: true, turnResourceCardTaxonomiesIntoLinks: false, requireAuthenticationForFavorites: false },
  printableDirectories: { accessMode: 'everyone', allowedEmails: [], allowedDomains: [], userGroups: [] },
  footer: { customMenu: [], copyright: 'Synthetic prototype data' },
  header: { customMenu: [{ name: 'Events', href: '#' }, { name: 'About Us', href: '#' }], position: 'static', safeExit: { enabled: true, text: 'Quick exit', url: 'https://www.weather.gov', target: '_self' } },
  i18n: { defaultLocale: 'en', locales: ['en'] }, meta: { description: 'Prototype', title: 'Sample County Resources' },
  pages: { accessibilityPage: { enabled: false }, privacyPolicyPage: { enabled: false }, termsOfUsePage: { enabled: false } },
  resource: { layout: { leftColumn: [], rightColumn: [] } },
  search: { facets: [], map: { center: [-122.48, 48.75], zoom: 10 }, radiusOptions: [{ value: 10 }, { value: 25 }], defaultRadius: 0, searchEngine: 'ai_classification', resultsLimit: 25, pinnedResourcesMode: 'ignore', texts: { title: 'How can we help?', queryInputPlaceholder: 'Describe how you need help' } },
  badges: [], suggestions: ['Getting Enough Food', 'A Place to Sleep Tonight', 'Money for Basic Needs', 'Getting Around', 'Child Care or Adult Day Care'].map((value) => ({ value, taxonomies: 'BD' })), tenantId: '00000000-0000-4000-8000-000000000001',
  topics: { iconSize: 'small', list: [['Care', ['Child Care', 'Support Networks']], ['Emergency', ['Domestic Violence', 'Help Hotlines']], ['Food', ['Food Banks', 'Meal Programs']], ['Housing', ['Shelter', 'Help Pay for Housing']], ['Money', ['Financial Assistance']], ['Health', ['Medical', 'Dental']]].map(([name, s]) => ({ name, subtopics: s.map((n) => ({ name: n, queryType: 'text', query: n })) })) },
};
const basic = { enabledLocales: ['en'], defaultLocale: 'en', auth: { requiresLogin: false, allowedEmailDomains: [], publicPages: [] }, seo: { noindex: true } };
const style = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#dfeaf2' } }] };
http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
    const u = new URL(req.url, 'http://x'); const p = u.pathname.replace(/\/$/, ''); const q = u.searchParams.get('query') || u.searchParams.get('q') || '';
    const send = (o) => { res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(o)); };
    console.log(req.method, p, q.slice(0, 40));
    if (p === '/style.json') return send(style);
    if (p === '/api/internal/app-config') return send(appConfig);
    if (p === '/api/getTenantBasicConfig') return send(basic);
    if (p === '/search/predict') return send(predict(q));
    if (p === '/search/re-rank') return send({ hsis_taxonomies: ['BD-5000'] });
    if (p === '/suggestion') return send({ taxonomies: [], organizations: [] });
    if (p === '/search') { const stated = (u.searchParams.get('taxonomy') || '').split(',').filter(Boolean); const hits = matchServices(stated.length ? stated : classifySune(q).codes).map(svc); return send({ search: { hits: { total: { value: hits.length }, hits } }, facets: [] }); }
    send(null);
  });
}).listen(4100, () => console.log('stub on 4100'));
