import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  type ExistingPage,
  type ExistingSlug,
  type GenerationPlan,
  type PlanInput,
  type PlanTopic,
  type SelectedRegion,
  planGeneration,
} from '../src/app/(app)/features/landing-pages/lib/plan';

const PIERCE: SelectedRegion = {
  id: 'county:53053',
  type: 'county',
  name: 'Pierce County, WA',
  state: 'WA',
};
const TACOMA: SelectedRegion = {
  id: 'place:5370000',
  type: 'place',
  name: 'Tacoma',
  state: 'WA',
  countyId: 'county:53053',
};
const FOOD: PlanTopic = {
  id: 1,
  trashed: false,
  slugs: { en: 'food', es: 'alimentos' },
  names: { en: 'Food', es: 'Alimentos', zh: '食物' },
  search: { queryType: 'taxonomy', query: 'BD' },
};

const searchPath = (topic: PlanTopic, region: SelectedRegion) =>
  `/search?query=${topic.search.query}&region=${region.id}`;

function base(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    regions: [PIERCE, TACOMA],
    topics: [FOOD],
    pages: [],
    slugs: [],
    searchPath,
    ...overrides,
  };
}

/** Applies a plan to in-memory rows, as the CMS would. */
function apply(
  input: PlanInput,
  plan: GenerationPlan,
): { pages: ExistingPage[]; slugs: ExistingSlug[] } {
  let nextId = 1000;
  const ids = new Map<string, number>();
  const pages = input.pages.map((page) => ({ ...page }));
  for (const create of plan.creates) {
    const id = nextId++;
    ids.set(create.key, id);
    pages.push({
      id,
      topicId: create.topicId,
      regionId: create.region.id,
      regionType: create.region.type,
      regionName: create.region.name,
      regionState: create.region.state,
      countyId: create.region.countyId ?? null,
      placeSlug: create.placeSlug,
      status: 'live',
      redirectPageId: null,
      redirectPath: null,
    });
  }
  const idOf = (ref: { id: number } | { key: string }) =>
    'id' in ref ? ref.id : ids.get(ref.key)!;
  for (const change of plan.pageUpdates) {
    const page = pages.find((p) => p.id === change.id)!;
    page.status = change.status;
    page.redirectPageId = change.redirectPage
      ? idOf(change.redirectPage)
      : null;
    page.redirectPath = change.redirectPath;
  }
  const slugs = input.slugs.map((slug) => ({ ...slug }));
  for (const update of plan.slugUpdates) {
    const slug = slugs.find((s) => s.id === update.id)!;
    slug.current = update.current;
    if (update.page) slug.pageId = idOf(update.page);
  }
  for (const insert of plan.slugInserts) {
    slugs.push({
      id: nextId++,
      pageId: idOf(insert.page),
      locale: insert.locale,
      path: insert.path,
      current: true,
    });
  }
  return { pages, slugs };
}

/** Generates `input`, then returns the input for the next run. */
function generate(input: PlanInput) {
  const plan = planGeneration(input);
  return { plan, next: { ...input, ...apply(input, plan) } };
}

const pageFor = (
  rows: { pages: ExistingPage[] },
  regionId: string,
  topicId = 1,
) => rows.pages.find((p) => p.regionId === regionId && p.topicId === topicId)!;

describe('planGeneration', () => {
  test('creates every region × topic, the state page, and an address per locale', () => {
    const { plan, next } = generate(base());
    assert.equal(plan.summary.creates, 3);
    assert.equal(plan.summary.addressChanges, 0); // first addresses, not moves
    assert.deepEqual(next.slugs.map((s) => `${s.locale}/${s.path}`).sort(), [
      'en/food/pierce-county-wa',
      'en/food/tacoma-wa',
      'en/food/washington',
      'es/alimentos/pierce-county-wa',
      'es/alimentos/tacoma-wa',
      'es/alimentos/washington',
    ]);
    assert.deepEqual(plan.conflicts, []);
  });

  test('a locale without a Latin slug uses the default locale slug', () => {
    const { next } = generate(
      base({ locales: ['en', 'zh'], regions: [TACOMA] }),
    );
    assert.ok(
      next.slugs.some((s) => s.locale === 'zh' && s.path === 'food/tacoma-wa'),
    );
  });

  test('running twice changes nothing', () => {
    const { next } = generate(base());
    const again = planGeneration(next);
    assert.equal(again.creates.length, 0);
    assert.equal(again.pageUpdates.length, 0);
    assert.equal(again.slugInserts.length, 0);
    assert.equal(again.slugUpdates.length, 0);
    assert.equal(again.summary.unchanged, 3);
  });

  test('a removed city redirects to its county, a removed county to the state', () => {
    const first = generate(base()).next;
    const cityGone = generate({ ...first, regions: [PIERCE] }).next;
    const tacoma = pageFor(cityGone, TACOMA.id);
    assert.equal(tacoma.status, 'retired');
    assert.equal(tacoma.redirectPageId, pageFor(cityGone, PIERCE.id).id);

    const countyGone = generate({
      ...first,
      regions: [
        { id: 'state:WA', type: 'state', name: 'Washington', state: 'WA' },
      ],
    }).next;
    assert.equal(
      pageFor(countyGone, TACOMA.id).redirectPageId,
      pageFor(countyGone, 'state:WA').id,
    );
    assert.equal(
      pageFor(countyGone, PIERCE.id).redirectPageId,
      pageFor(countyGone, 'state:WA').id,
    );
  });

  test('a removed state redirects to its search', () => {
    const first = generate(base()).next;
    const { next } = generate({ ...first, regions: [] });
    const state = pageFor(next, 'state:WA');
    assert.equal(state.status, 'retired');
    assert.equal(state.redirectPath, '/search?query=BD&region=state:WA');
    assert.equal(
      pageFor(next, TACOMA.id).redirectPath,
      '/search?query=BD&region=place:5370000',
    );
  });

  test('a disabled topic redirects every page to its search', () => {
    const first = generate(base()).next;
    const { plan, next } = generate({
      ...first,
      topics: [{ ...FOOD, trashed: true }],
    });
    assert.equal(plan.summary.retires, 3);
    assert.equal(
      pageFor(next, PIERCE.id).redirectPath,
      '/search?query=BD&region=county:53053',
    );
  });

  test('chains collapse when a target page retires', () => {
    const first = generate(base()).next;
    const cityGone = generate({ ...first, regions: [PIERCE] }).next;
    // Tacoma → Pierce; now Pierce goes too, so Tacoma must point at the state.
    const { plan, next } = generate({
      ...cityGone,
      regions: [
        { id: 'state:WA', type: 'state', name: 'Washington', state: 'WA' },
      ],
    });
    const state = pageFor(next, 'state:WA');
    assert.equal(pageFor(next, TACOMA.id).redirectPageId, state.id);
    assert.equal(pageFor(next, PIERCE.id).redirectPageId, state.id);
    assert.equal(plan.summary.redirectsUpdated, 1);
  });

  test('an admin-set target is kept when its page stays live', () => {
    const first = generate(base()).next;
    const state = pageFor(first, 'state:WA');
    const pages = first.pages.map((p) =>
      p.regionId === TACOMA.id ? { ...p, redirectPageId: state.id } : p,
    );
    const { next } = generate({ ...first, pages, regions: [PIERCE] });
    assert.equal(pageFor(next, TACOMA.id).redirectPageId, state.id);
  });

  test('a re-added region revives its page at the same address', () => {
    const first = generate(base()).next;
    const gone = generate({ ...first, regions: [PIERCE] }).next;
    const { plan, next } = generate({ ...gone, regions: [PIERCE, TACOMA] });
    assert.equal(plan.summary.revives, 1);
    assert.equal(plan.creates.length, 0);
    const tacoma = pageFor(next, TACOMA.id);
    assert.equal(tacoma.status, 'live');
    assert.equal(tacoma.redirectPageId, null);
    assert.equal(plan.slugInserts.length, 0);
  });

  test('off pages stay off', () => {
    const first = generate(base()).next;
    const pages = first.pages.map((p) =>
      p.regionId === TACOMA.id ? { ...p, status: 'off' as const } : p,
    );
    const plan = planGeneration({ ...first, pages });
    assert.equal(plan.pageUpdates.length, 0);
  });

  test('a topic slug edit adds a current address and keeps the old one', () => {
    const first = generate(base({ regions: [TACOMA] })).next;
    const { plan, next } = generate({
      ...first,
      topics: [{ ...FOOD, slugs: { ...FOOD.slugs, en: 'food-banks' } }],
    });
    assert.equal(plan.summary.addressChanges, 2); // Tacoma and the state, in en
    const tacomaId = pageFor(next, TACOMA.id).id;
    const rows = next.slugs.filter(
      (s) => s.pageId === tacomaId && s.locale === 'en',
    );
    assert.deepEqual(rows.map((s) => [s.path, s.current]).sort(), [
      ['food-banks/tacoma-wa', true],
      ['food/tacoma-wa', false],
    ]);
    // Editing it back makes the old row current again, with no new row.
    const back = planGeneration({ ...next, topics: [FOOD] });
    assert.equal(back.slugInserts.length, 0);
  });

  test('two places with one name get distinct slugs', () => {
    const KING: SelectedRegion = {
      id: 'county:53033',
      type: 'county',
      name: 'King County, WA',
      state: 'WA',
    };
    const fairview = (n: string, countyId: string): SelectedRegion => ({
      id: `place:53${n}`,
      type: 'place',
      name: 'Fairview',
      state: 'WA',
      countyId,
    });
    const plan = planGeneration(
      base({
        locales: ['en'],
        regions: [
          PIERCE,
          KING,
          fairview('00001', PIERCE.id),
          fairview('00002', KING.id),
        ],
      }),
    );
    const slugs = plan.creates
      .filter((c) => c.region.name === 'Fairview')
      .map((c) => c.placeSlug)
      .sort();
    assert.deepEqual(slugs, ['fairview-king-county-wa', 'fairview-wa']);
  });

  test('two topics with one slug report a conflict instead of sharing an address', () => {
    const plan = planGeneration(
      base({
        locales: ['en'],
        regions: [TACOMA],
        topics: [FOOD, { ...FOOD, id: 2 }],
      }),
    );
    assert.ok(plan.conflicts.length > 0);
    const paths = plan.slugInserts.map((s) => s.path);
    assert.equal(new Set(paths).size, paths.length);
  });
});
