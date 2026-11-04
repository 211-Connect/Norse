// Prototype only. Fake CMS + fake Norse-API on :4100, so the public app runs with no database and no real data.
import http from 'node:http';
const svc = (id, name, org, summary, who, lat, lon, tax, phone = '(555) 010-01' + id, addr = id + '00 Main St') => ({ _id: id, _source: {
  service_at_location_id: 'sal-' + id, name: org, priority: 0, phone, url: 'https://example.org/' + id,
  service: { name, summary, description: summary + ' This is synthetic sample data for a design prototype.', eligibility: who, application_process: 'Call to apply.' },
  organization: { alternate_name: org }, attribution: 'Sample Data Collaborative',
  location: { name: org, point: { type: 'Point', coordinates: [lon, lat] }, physical_address: { address_1: addr, city: 'Sampleton', state: 'WA', postal_code: '98000' } },
  taxonomies: tax.map((t, i) => ({ code: 'X-' + id + i, name: t })), schedule: 'Mon-Fri 9:00 AM-5:00 PM' } });
const SETS = {
  meals: [
    svc('11', 'Meals on Wheels', 'Sampleton Senior Services', 'Hot meals delivered to older adults at home.', 'Adults 60 and older who cannot cook.', 48.75, -122.48, ['Home Delivered Meals']),
    svc('12', 'Hospital-to-Home Meals', 'Sample County Health', 'Two weeks of meals after a hospital stay.', 'Anyone just home from the hospital.', 48.76, -122.46, ['Home Delivered Meals', 'Discharge Support']),
    svc('13', 'Family Caregiver Support', 'Area Agency on Aging', 'Respite and coaching for family caregivers.', 'People caring for an older relative.', 48.74, -122.5, ['Caregiver Support', 'Respite Care']),
    svc('14', 'Senior Ride Connection', 'Sample Transit', 'Door-to-door rides to appointments and shopping.', 'Adults 60 and older.', 48.78, -122.44, ['Senior Ride Programs']),
    svc('15', 'Community Dining Room', 'Northside Church', 'A free hot lunch, Monday to Friday.', 'Open to all.', 48.72, -122.52, ['Congregate Meals']),
  ],
  food: [
    svc('21', 'Food Pantry', 'Sampleton Food Bank', 'Groceries once a week, market style.', 'Open to all.', 48.75, -122.47, ['Food Pantries']),
    svc('22', 'Emergency Food Boxes', 'Eastside Mission', 'A three-day food box, same day.', 'Open to all.', 48.77, -122.45, ['Emergency Food']),
    svc('23', 'SNAP Application Help', 'Sample County Benefits', 'Help applying for food benefits.', 'Low-income households.', 48.73, -122.49, ['Food Stamps/SNAP']),
  ],
};
const unclear = (q) => q.trim().split(/\s+/).length <= 2 && !/food/i.test(q);
const opts = [['Housing', .4, 12], ['Bills and Money', .35, 9], ['Food', .3, 14], ['Health Care', .2, 8]].map(([code, score, results_count], i) => ({ code, score, pre_selected: false, results_count }));
const predict = (q) => unclear(q) ? { scenario: 'clarify_low_info', hsis_taxonomies: [], options: opts } : { scenario: 'search', hsis_taxonomies: ['BD-5000'], options: [{ code: 'Food', score: .9, pre_selected: true, results_count: 5 }] };
const appConfig = {
  accessibility: { fontSize: { allowedValues: ['100%', '125%'] } },
  brand: { name: 'Sample County Resources', theme: { primaryColor: '#0D6C68', secondaryColor: '#7DBFA7', borderRadius: '16px' } },
  contact: { number: '211' }, sms: null,
  featureFlags: { enablePrintableDirectories: false, enableOrganizationSearch: false, requireUserLocation: false, showAgeFilter: false, showFeedbackButtonGlobal: false, showFeedbackButtonOnResourcePages: false, showHomePageTour: false, showPrintButton: true, showSearchAndResourceServiceName: true, showSuggestionListTaxonomyBadge: false, showOrganizationLocationBadge: false, showUseMyLocationButtonOnDesktop: true, turnResourceCardTaxonomiesIntoLinks: false, requireAuthenticationForFavorites: false },
  printableDirectories: { accessMode: 'everyone', allowedEmails: [], allowedDomains: [], userGroups: [] },
  footer: { customMenu: [], copyright: 'Synthetic prototype data' },
  header: { customMenu: [{ name: 'Events', href: '#' }, { name: 'About Us', href: '#' }], position: 'static', safeExit: { enabled: true, text: 'Quick exit', url: 'https://www.weather.gov', target: '_self' } },
  i18n: { defaultLocale: 'en', locales: ['en'] }, meta: { description: 'Prototype', title: 'Sample County Resources' },
  pages: { accessibilityPage: { enabled: false }, privacyPolicyPage: { enabled: false }, termsOfUsePage: { enabled: false } },
  resource: { layout: { leftColumn: [], rightColumn: [] } },
  search: { facets: [], map: { center: [-122.48, 48.75], zoom: 10 }, radiusOptions: [{ value: 10 }, { value: 25 }], defaultRadius: 0, searchEngine: 'ai_classification', resultsLimit: 25, pinnedResourcesMode: 'ignore', texts: { title: 'How can we help?', queryInputPlaceholder: 'Describe how you need help' } },
  badges: [], suggestions: ['Help finding food', 'Help finding a place to stay tonight', 'Help paying my bills', 'Help with transportation', 'Help finding child care'].map((value) => ({ value, taxonomies: 'BD' })), tenantId: '00000000-0000-4000-8000-000000000001',
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
    if (p === '/search') { const hits = /food|pantry/i.test(q) && !/cook|hospital/i.test(q) ? SETS.food : SETS.meals; return send({ search: { hits: { total: { value: hits.length }, hits } }, facets: [] }); }
    send(null);
  });
}).listen(4100, () => console.log('stub on 4100'));
