// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// The dialog's submit handler (useOnSearchSubmit): link topics open their href (BUILDERS 3); everything
// else is routed to classic search (1) or AI classification (2a), by tenant engine, query, organization
// and the requireUserLocation flag, and AI results go on by classifier outcome (search, notify, clarify).
import { getDefaultStore } from 'jotai';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

import { client, edge, PREDICT_OUTCOMES, PROFILES } from './edges';
import type { Row } from './snapshots';

const ENGINES = PROFILES.filter((p) => !p.advancedGeo);
const i18n = i18next.createInstance();
void i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {},
  initAsync: false,
});

function dialogStates(row: Row) {
  const p = new URLSearchParams(row.query);
  const coords = (p.get('coords') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const base = {
    queryLabel: p.get('query_label') ?? '',
    queryType: p.get('query_type') ?? '',
    organizationId: p.get('organization_id') ?? '',
    href: '',
    target: '',
    searchLocation: p.get('location') ?? '',
    searchCoordinates: p.get('coords') ? coords : [],
    searchDistance: p.get('distance') ?? '',
    searchLocationValidationError: '',
  };
  const text = p.get('query') ?? '';
  const url = `${row.path.replace(/^\/adresources/, '')}${row.query ? `?${row.query}` : ''}`;
  return [
    { id: 'picked', state: { ...base, query: text, searchTerm: text } },
    { id: 'typed', state: { ...base, query: '', searchTerm: text } },
    {
      id: 'link-same-tab',
      state: {
        ...base,
        query: text,
        searchTerm: text,
        queryType: 'link',
        href: url,
        target: '',
      },
    },
    {
      id: 'link-new-tab',
      state: {
        ...base,
        query: text,
        searchTerm: text,
        queryType: 'link',
        href: url,
        target: '_blank',
      },
    },
  ];
}

export async function* submitCases(corpus: Row[]) {
  const { useOnSearchSubmit } =
    await import('../../../src/app/(app)/features/search/hooks/useOnSearchSubmit');
  const { DEFAULT_SEARCH_STATE, searchAtom } =
    await import('../../../src/app/(app)/shared/store/search');
  for (const row of corpus) {
    for (const profile of ENGINES) {
      for (const d of dialogStates(row)) {
        for (const requireLocation of [false, true]) {
          let predictCalled = false;
          for (const predict of PREDICT_OUTCOMES) {
            if (predict !== PREDICT_OUTCOMES[0] && !predictCalled) break; // only replay outcomes when consulted
            edge.profile = profile;
            edge.predict = predict;
            edge.calls = { predict: 0, geocode: 0 };
            client.reset('/search', row.query);
            client.flags = { requireUserLocation: requireLocation };
            client.dialog = { ...d.state };
            client.dialogUpdates = [];
            getDefaultStore().set(searchAtom, {
              ...DEFAULT_SEARCH_STATE,
              ...d.state,
            } as never);
            const pending: Array<unknown> = [];
            const set: Record<string, unknown> = {};
            let submit: ((e: unknown) => Promise<void>) | undefined;
            function Probe() {
              submit = useOnSearchSubmit({
                activeAiAction: null,
                setActiveAiAction: (v: unknown) => (set.activeAiAction = v),
                setAiSearchScenario: (v: unknown) => (set.scenario = v),
                setDialogOpen: (v: unknown) => (set.dialogOpen = v),
                setClarifyValidationError: (v: unknown) =>
                  (set.validationError = v),
                setClarifyOptions: (v: unknown) => (set.clarifyOptions = v),
                setSelectedClarifyCodes: (v: unknown) =>
                  (set.selectedCodes = v),
                startTransition: (cb: () => unknown) => void pending.push(cb()),
              } as never);
              return null;
            }
            renderToString(
              createElement(I18nextProvider, { i18n }, createElement(Probe)),
            );
            const nav: string[] = [];
            const g = globalThis as Record<string, unknown>;
            const hadWindow = 'window' in g;
            if (d.id.startsWith('link')) {
              g.window = {
                location: { assign: (u: string) => nav.push(`assign ${u}`) },
                open: (u: string, t: string) => nav.push(`open ${u} ${t}`),
              };
            }
            await submit!({ preventDefault() {} });
            await Promise.all(pending);
            if (!hadWindow) delete g.window;
            predictCalled = edge.calls.predict > 0;
            yield {
              case: `${row.scenario}|${profile.searchEngine}|${d.id}|requireLocation=${requireLocation}${predictCalled ? `|predict=${predict}` : ''}`,
              output: {
                nav,
                set,
                dialogUpdates: client.dialogUpdates,
                ...client.observed(),
              },
            };
          }
        }
      }
    }
  }
  client.flags = {};
}
