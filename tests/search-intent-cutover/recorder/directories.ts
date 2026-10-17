// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// The printable-directory chain, end to end, for every scenario:
//   search results page  -> "Save search to directory" (results-section serialises the URL, 16a)
//   -> save dialog (include location on / off) -> server action -> Norse-API payload (what gets stored)
//   -> closing the dialog clears pdid / pdsid from the URL (BUILDERS 11)
//   -> the directory page renders the section link (15) and the source link (16) from the stored params,
//      with and without a directory default location.
// The save flow needs effects and clicks, so it runs in a real DOM (happy-dom); the directory page is
// server-rendered.
import { getDefaultStore } from 'jotai';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

import { act, closeDom, settle, withDom } from './dom';
import { client, edge } from './edges';
import { hrefsOf } from './links';
import type { Row } from './snapshots';

const i18n = i18next.createInstance();
void i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {},
  initAsync: false,
});

const DEFAULT_CONFIGS = {
  none: null,
  'default-location': {
    coords: { longitude: -122.3, latitude: 47.6 },
    locationName: 'synthetic default',
    radius: 15,
  },
};

/**
 * Both dialog variants in one mount: save with "include location" on (its default), then reopen, switch it
 * off and save again. Checked against separate mounts: identical results for every case.
 */
async function saveFlows(row: Row) {
  const { ResultsSection } =
    await import('../../../src/app/(app)/features/search/components/results-section');
  const { searchAtom, DEFAULT_SEARCH_STATE } =
    await import('../../../src/app/(app)/shared/store/search');
  const p = new URLSearchParams(row.query);
  getDefaultStore().set(searchAtom, {
    ...DEFAULT_SEARCH_STATE,
    query: p.get('query') ?? '',
    queryLabel: p.get('query_label') ?? '',
    queryType: p.get('query_type') ?? '',
  } as never);
  client.reset(row.path.replace(/^\/adresources/, '') || '/', row.query);
  client.results = {
    sort: 'relevance',
    hasSearchCoordinates: false,
    filters: {},
    results: [{ id: 'r-1' }],
    totalResults: 1,
    currentPage: 1,
  };
  edge.apiCalls = [];
  return withDom(
    `https://tenant.test${row.path}${row.query ? `?${row.query}` : ''}`,
    async (mount) => {
      const host = await mount(
        createElement(
          I18nextProvider,
          { i18n },
          createElement(ResultsSection, {
            cardLayout: undefined,
            aiSearchAlert: undefined,
          } as never),
        ),
      );
      // The save dialog is the one with this title (rendered from the start; its fields only after opening).
      const dialogEl = [...host.querySelectorAll('[data-dialog]')].find((d) =>
        (d.textContent ?? '').includes(
          'printable_directories.save_query.dialog_title',
        ),
      );
      const index = dialogEl
        ? Number(dialogEl.getAttribute('data-dialog'))
        : -1;
      const results: Record<
        'on' | 'off',
        Record<string, unknown>
      > = {} as never;
      for (const variant of ['on', 'off'] as const) {
        const before = {
          calls: edge.apiCalls.length,
          pushes: client.pushes.length,
          replaces: client.replaces.length,
          cookies: client.cookies.length,
        };
        // Open it the way Radix does, through onOpenChange(true); its effect then loads the directories.
        const openChange = index >= 0 ? client.dialogs[index] : undefined;
        if (openChange) await act(async () => openChange(true));
        await settle();
        if (variant === 'off') {
          const toggle = client.handlers.checkbox as
            ((v: boolean) => void) | undefined;
          if (toggle) await act(async () => toggle(false));
          await settle();
        }
        const footer = dialogEl?.querySelector('[data-footer]');
        const buttons = footer ? [...footer.querySelectorAll('button')] : [];
        const save = buttons.at(-1) as unknown as { click(): void } | undefined;
        if (save) await act(async () => save.click());
        await settle();
        const call = edge.apiCalls
          .slice(before.calls)
          .find((c) => c.op === 'createSource');
        // A save that never completes would record "nothing stored" in the baseline and later runs alike.
        if (save && !call)
          throw new Error(
            `directories: save clicked but no API call (${row.scenario}, location ${variant})`,
          );
        results[variant] = {
          saveDialog: index >= 0,
          saveButton: Boolean(save),
          stored:
            (call?.body as { query?: { params?: unknown } } | undefined)?.query
              ?.params ?? null,
          apiPayload: call?.body ?? null,
          pushes: client.pushes.slice(before.pushes),
          replaces: client.replaces.slice(before.replaces),
          cookies: client.cookies.slice(before.cookies),
        };
      }
      return results;
    },
  );
}

async function directoryLinks(
  stored: unknown,
  config: (typeof DEFAULT_CONFIGS)[keyof typeof DEFAULT_CONFIGS],
) {
  const { SectionItem } =
    await import('../../../src/app/(app)/features/printable-directories/components/detail/section-item');
  const noop = () => undefined;
  const section = {
    id: 'sec-1',
    headingLocalized: { en: 'Section' },
    descriptionLocalized: {},
    maxResources: 10,
    order: 0,
    // Shaped like PrintableDirectorySourceResponseDto: what the API returns for the source just stored.
    sources: stored
      ? [
          {
            id: 'src-1',
            order: 0,
            type: 'query',
            query: { title: 'Saved search', params: stored },
            resources: [],
          },
        ]
      : [],
  };
  const html = renderToString(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(SectionItem as never, {
        directoryId: 'dir-1',
        primaryLanguage: 'en',
        section,
        defaultQueryConfig: config,
        index: 0,
        isLast: true,
        isExpanded: true,
        onToggleExpand: noop,
        isReorderingSections: false,
        isMutatingSources: false,
        onMoveSection: noop,
        onEditSection: noop,
        isSourceExpanded: () => true,
        onToggleSourceExpand: noop,
        onMoveSource: noop,
        onDeleteSource: noop,
      }),
    ),
  );
  return hrefsOf(html).filter((h) => h.includes('search'));
}

export async function* directoryCases(corpus: Row[]) {
  for (const row of corpus) {
    const flows = await saveFlows(row);
    for (const variant of ['on', 'off'] as const) {
      const saved = flows[variant];
      const links: Record<string, string[]> = {};
      for (const [name, config] of Object.entries(DEFAULT_CONFIGS))
        links[name] = await directoryLinks(saved.stored, config);
      yield {
        case: `${row.scenario}|location=${variant}`,
        output: { ...saved, links },
      };
    }
  }
  await closeDom();
}
