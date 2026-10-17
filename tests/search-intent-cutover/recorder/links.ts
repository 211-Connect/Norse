// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Components that render a search link: topic cards (BUILDERS 12, 13), resource category badges (14),
// the "no favorites" card (17), and the shared Link / LocalizedLink every CMS-configured href goes
// through (19, 20: header, menus, footer, home callouts, highlights, alerts all pass their href to Link
// unchanged). Each is rendered for real in both locales and its hrefs are read from the HTML.
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

import { client } from './edges';
import type { Row } from './snapshots';

const LOCALES = ['en', 'es'];
const i18ns = new Map<string, typeof i18next>();
function i18n(locale: string) {
  let inst = i18ns.get(locale);
  if (!inst) {
    inst = i18next.createInstance();
    void inst.init({
      lng: locale,
      fallbackLng: 'en',
      resources: {},
      initAsync: false,
    });
    i18ns.set(locale, inst);
  }
  return inst;
}

export function hrefsOf(html: string): string[] {
  return [...html.matchAll(/href="([^"]*)"/g)].map((m) =>
    m[1]
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&'),
  );
}

function render(locale: string, node: ReturnType<typeof createElement>) {
  return hrefsOf(
    renderToString(
      createElement(I18nextProvider, { i18n: i18n(locale) }, node),
    ),
  );
}

/** A row's values as the CMS or the API would hold them: decoded, first value of each key. */
function values(row: Row) {
  const p = new URLSearchParams(row.query);
  return {
    query: p.get('query') ?? '',
    label: p.get('query_label') ?? '',
    queryType: p.get('query_type') ?? '',
    url: `${row.path.replace(/^\/adresources/, '')}${row.query ? `?${row.query}` : ''}`,
  };
}

// ------------------------------------------------------------------ 12, 13: topic cards
export async function* topicCases(corpus: Row[]) {
  const { CategoriesSection } =
    await import('../../../src/app/(app)/features/home/components/categories-section');
  for (const row of corpus) {
    const v = values(row);
    client.config = {
      topics: {
        iconSize: 'small',
        imageBorderRadius: 0,
        customHeading: 'Topics',
        list: [
          {
            name: 'subtopic built from query',
            subtopics: [
              {
                name: v.label || 'label',
                query: v.query,
                queryType: v.queryType,
              },
            ],
          },
          {
            name: 'subtopic without query type',
            subtopics: [{ name: v.label || 'label', query: v.query }],
          },
          {
            name: 'subtopic with CMS href',
            subtopics: [
              {
                name: 'cms',
                query: v.query,
                queryType: v.queryType,
                href: v.url,
              },
            ],
          },
          { name: 'topic with CMS href', subtopics: [], href: v.url },
          { name: 'topic with no href', subtopics: [] },
        ],
      },
    };
    for (const locale of LOCALES) {
      yield {
        case: `${row.scenario}|${locale}`,
        output: {
          hrefs: render(locale, createElement(CategoriesSection, {} as never)),
        },
      };
    }
  }
  client.config = {};
}

// ------------------------------------------------------------------ 14: resource category badges
export async function* categoryCases(corpus: Row[]) {
  const { CategoriesComponent } =
    await import('../../../src/app/(app)/features/resource/components/resource-components/categories');
  for (const row of corpus) {
    const v = values(row);
    const code = v.query.split(',')[0] || 'BD-1800.2000';
    for (const locale of LOCALES) {
      for (const flag of [true, false]) {
        client.flags = { turnResourceCardTaxonomiesIntoLinks: flag };
        const hrefs = render(
          locale,
          createElement(CategoriesComponent, {
            resource: {
              categories: [
                { code, name: v.label || 'label' },
                { code: '', name: 'no code' },
              ] as never,
            },
          }),
        );
        yield {
          case: `${row.scenario}|${locale}|links=${flag}`,
          output: { hrefs },
        };
      }
    }
  }
  client.flags = {};
}

// ------------------------------------------------------------------ 17: no favorites card
export async function* noFavoritesCases() {
  const { NoFavoritesCard } =
    await import('../../../src/app/(app)/features/favorites/components/no-favorites-card');
  for (const locale of LOCALES) {
    yield {
      case: locale,
      output: { hrefs: render(locale, createElement(NoFavoritesCard)) },
    };
  }
}

// ------------------------------------------------------------------ 19, 20: CMS hrefs through Link
export async function* cmsLinkCases(corpus: Row[]) {
  const { Link } =
    await import('../../../src/app/(app)/shared/components/link');
  for (const row of corpus) {
    const v = values(row);
    for (const locale of LOCALES) {
      for (const [kind, href] of [
        ['relative', v.url],
        ['absolute', `https://other.test${v.url}`],
        ['no-leading-slash', v.url.replace(/^\//, '')],
      ] as const) {
        yield {
          case: `${row.scenario}|${locale}|${kind}`,
          output: {
            hrefs: render(locale, createElement(Link, { href }, 'link')),
          },
        };
      }
    }
  }
}
