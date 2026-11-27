/**
 * The landing-page generation diff (docs/landing-pages.md, "Generating
 * pages"): from the Resource Directory's selection (regions × topics
 * not in the trash, in every tenant locale) and the rows that exist, what to create,
 * retire, revive and re-address. Pure: the CMS applies the plan, and the
 * Apply-changes preview shows its summary without writing.
 */

import {
  STATE_NAMES,
  bareRegionName,
  landingPath,
  placeSlug,
  slugify,
  topicSlugFor,
  topicSlugProblem,
} from './slugs';

export type RegionType = 'state' | 'county' | 'place';

/** A region as the selection stores it. */
export type SelectedRegion = {
  id: string;
  type: RegionType;
  name: string;
  state: string;
  countyId?: string | null;
};

export type PlanTopic = {
  id: number;
  /** In the trash: its pages retire, and redirect to its search. */
  trashed: boolean;
  /** Localized slug and name, by locale. */
  slugs: Partial<Record<string, string | null>>;
  names: Partial<Record<string, string | null>>;
  search: { queryType: string; query: string };
};

export type PageStatus = 'live' | 'off' | 'retired';

export type ExistingPage = {
  id: number;
  topicId: number;
  regionId: string;
  regionType: RegionType;
  regionName: string;
  regionState: string;
  countyId: string | null;
  placeSlug: string;
  status: PageStatus;
  redirectPageId: number | null;
  redirectPath: string | null;
};

export type ExistingSlug = {
  id: number;
  pageId: number;
  locale: string;
  path: string;
  current: boolean;
};

export type PlanInput = {
  locales: readonly string[];
  defaultLocale: string;
  regions: readonly SelectedRegion[];
  topics: readonly PlanTopic[];
  pages: readonly ExistingPage[];
  slugs: readonly ExistingSlug[];
  /** The `/search` URL equivalent to a topic in a region, or null. */
  searchPath: (topic: PlanTopic, region: SelectedRegion) => string | null;
};

/** A page that exists (`id`) or that this plan creates (`key`). */
export type PageRef = { id: number } | { key: string };

export type PlannedPage = {
  key: string;
  topicId: number;
  region: SelectedRegion;
  placeSlug: string;
  label: string;
};

export type PageChange = {
  id: number;
  status: PageStatus;
  redirectPage: PageRef | null;
  redirectPath: string | null;
};

export type SlugInsert = { page: PageRef; locale: string; path: string };

/** An existing address row: made (not) current, possibly moved to a page. */
export type SlugUpdate = { id: number; current: boolean; page?: PageRef };

export type PlanSummary = {
  creates: number;
  retires: number;
  revives: number;
  unchanged: number;
  addressChanges: number;
  redirectsUpdated: number;
  conflicts: number;
};

export type GenerationPlan = {
  creates: PlannedPage[];
  pageUpdates: PageChange[];
  slugInserts: SlugInsert[];
  slugUpdates: SlugUpdate[];
  conflicts: string[];
  summary: PlanSummary;
};

export const pairKey = (topicId: number, regionId: string) =>
  `${topicId}|${regionId}`;

const refKey = (ref: PageRef) => ('id' in ref ? `#${ref.id}` : ref.key);

/** `Tacoma, WA`, `Pierce County, WA`, `Washington`: for labels. */
export function regionLabel(
  region: Pick<SelectedRegion, 'type' | 'name' | 'state'>,
) {
  if (region.type === 'state') return STATE_NAMES[region.state] ?? region.name;
  return `${bareRegionName(region.name)}, ${region.state}`;
}

/** The selection plus a state entry for every state it touches. */
function withStates(regions: readonly SelectedRegion[]): SelectedRegion[] {
  const byId = new Map(regions.map((region) => [region.id, region]));
  for (const region of regions) {
    const id = `state:${region.state}`;
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        type: 'state',
        name: STATE_NAMES[region.state] ?? region.state,
        state: region.state,
      });
    }
  }
  return [...byId.values()];
}

/**
 * Place slugs for the selected regions. A region keeps the slug its pages
 * already have; a new one gets `placeSlug`, then its county's name, then its
 * number when the slug is taken.
 */
function assignPlaceSlugs(
  regions: readonly SelectedRegion[],
  pages: readonly ExistingPage[],
): Map<string, string> {
  const result = new Map<string, string>();
  const taken = new Set<string>();
  const countyNames = new Map<string, string>();
  for (const page of pages) {
    result.set(page.regionId, page.placeSlug);
    taken.add(page.placeSlug);
    if (page.regionType === 'county') {
      countyNames.set(page.regionId, page.regionName);
    }
  }
  for (const region of regions) {
    if (region.type === 'county') countyNames.set(region.id, region.name);
  }
  const fresh = regions
    .filter((region) => !result.has(region.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const region of fresh) {
    let slug = placeSlug(region);
    const st = region.state.toLowerCase();
    const countyName = region.countyId
      ? countyNames.get(region.countyId)
      : undefined;
    if (taken.has(slug) && region.type === 'place' && countyName) {
      const county = slugify(bareRegionName(countyName));
      slug = slug.replace(new RegExp(`-${st}$`), `-${county}-${st}`);
    }
    if (taken.has(slug)) slug = `${slug}-${region.id.split(':')[1]}`;
    taken.add(slug);
    result.set(region.id, slug);
  }
  return result;
}

/** A topic's slug in each locale, or null when it has none at all. */
function topicSlugs(
  topic: PlanTopic,
  locales: readonly string[],
  defaultLocale: string,
): Map<string, string> | null {
  const valid = (slug: string | null | undefined) =>
    slug && !topicSlugProblem(slug) ? slug : null;
  const fallback =
    valid(topic.slugs[defaultLocale]) ??
    valid(slugify(topic.names[defaultLocale] ?? ''));
  if (!fallback) return null;
  return new Map(
    locales.map((locale) => [
      locale,
      valid(topic.slugs[locale]) ??
        topicSlugFor(topic.names[locale] ?? '', fallback),
    ]),
  );
}

export function planGeneration(input: PlanInput): GenerationPlan {
  const { locales, defaultLocale, pages, slugs } = input;
  const regions = withStates(input.regions);
  const regionsById = new Map(regions.map((region) => [region.id, region]));
  const topicsById = new Map(input.topics.map((topic) => [topic.id, topic]));
  const activeTopics = input.topics.filter((topic) => !topic.trashed);
  const placeSlugs = assignPlaceSlugs(regions, pages);
  const conflicts: string[] = [];

  const existingByPair = new Map(
    pages.map((page) => [pairKey(page.topicId, page.regionId), page]),
  );
  const pagesById = new Map(pages.map((page) => [page.id, page]));

  // 1. Which pairs are wanted, and the pages to create.
  const wanted = new Set<string>();
  const creates: PlannedPage[] = [];
  for (const topic of activeTopics) {
    for (const region of regions) {
      const key = pairKey(topic.id, region.id);
      wanted.add(key);
      if (existingByPair.has(key)) continue;
      creates.push({
        key,
        topicId: topic.id,
        region,
        placeSlug: placeSlugs.get(region.id)!,
        label: `${topic.names[defaultLocale] ?? topic.id} — ${regionLabel(region)}`,
      });
    }
  }

  // 2. Final status of every page; live pages by pair.
  const finalStatus = new Map<string, PageStatus>();
  const liveByPair = new Map<string, PageRef>();
  for (const create of creates) {
    finalStatus.set(create.key, 'live');
    liveByPair.set(create.key, { key: create.key });
  }
  let retires = 0;
  let revives = 0;
  let unchanged = 0;
  const newlyRetired = new Set<number>();
  for (const page of pages) {
    const key = pairKey(page.topicId, page.regionId);
    let status = page.status;
    if (wanted.has(key)) {
      if (page.status === 'retired') {
        status = 'live';
        revives++;
      } else {
        unchanged++;
      }
    } else if (page.status === 'live') {
      status = 'retired';
      newlyRetired.add(page.id);
      retires++;
    } else {
      unchanged++;
    }
    finalStatus.set(`#${page.id}`, status);
    if (status === 'live') liveByPair.set(key, { id: page.id });
  }
  const isLive = (ref: PageRef) => finalStatus.get(refKey(ref)) === 'live';

  // 3. Redirect targets of pages that are not live.
  type Target = { page: PageRef | null; path: string | null };
  const fallbackTarget = (page: ExistingPage): Target => {
    const topic = topicsById.get(page.topicId);
    const region: SelectedRegion = regionsById.get(page.regionId) ?? {
      id: page.regionId,
      type: page.regionType,
      name: page.regionName,
      state: page.regionState,
      countyId: page.countyId,
    };
    if (topic && !topic.trashed) {
      const parents =
        page.regionType === 'place'
          ? [page.countyId, `state:${page.regionState}`]
          : page.regionType === 'county'
            ? [`state:${page.regionState}`]
            : [];
      for (const parent of parents) {
        const live = parent && liveByPair.get(pairKey(page.topicId, parent));
        if (live) return { page: live, path: null };
      }
    }
    return { page: null, path: topic ? input.searchPath(topic, region) : null };
  };

  const targets = new Map<number, Target>();
  for (const page of pages) {
    if (finalStatus.get(`#${page.id}`) === 'live') continue;
    const own: Target = {
      page: page.redirectPageId ? { id: page.redirectPageId } : null,
      path: page.redirectPath,
    };
    const hasOwn = Boolean(own.page || own.path);
    // A page retired now gets a computed target unless an admin set one.
    targets.set(
      page.id,
      newlyRetired.has(page.id) && !hasOwn ? fallbackTarget(page) : own,
    );
  }

  // Collapse chains: a target page that is not live is replaced by its own
  // target, so every redirect lands in one hop.
  const resolve = (id: number): Target => {
    const seen = new Set<number>([id]);
    let target = targets.get(id) ?? { page: null, path: null };
    while (target.page && !isLive(target.page)) {
      const next = 'id' in target.page ? target.page.id : null;
      if (next === null || seen.has(next)) return { page: null, path: null };
      seen.add(next);
      target = targets.get(next) ?? { page: null, path: null };
    }
    return target;
  };

  const pageUpdates: PageChange[] = [];
  let redirectsUpdated = 0;
  for (const page of pages) {
    const status = finalStatus.get(`#${page.id}`)!;
    let target: Target =
      status === 'live' ? { page: null, path: null } : resolve(page.id);
    // A retired page whose target led nowhere falls back to the nearest
    // live parent or its search, rather than answering 410.
    if (status === 'retired' && !target.page && !target.path) {
      target = fallbackTarget(page);
    }
    const redirectPageId =
      target.page && 'id' in target.page ? target.page.id : null;
    const changedTarget =
      (target.page && 'key' in target.page) ||
      redirectPageId !== page.redirectPageId ||
      (target.path ?? null) !== page.redirectPath;
    if (status === page.status && !changedTarget) continue;
    if (status === page.status) redirectsUpdated++;
    pageUpdates.push({
      id: page.id,
      status,
      redirectPage: target.page,
      redirectPath: target.page ? null : target.path,
    });
  }

  // 4. Addresses of live and off pages, per locale.
  const slugByPath = new Map(slugs.map((s) => [`${s.locale}|${s.path}`, s]));
  const currentSlug = new Map(
    slugs.filter((s) => s.current).map((s) => [`#${s.pageId}|${s.locale}`, s]),
  );
  const slugInserts: SlugInsert[] = [];
  const slugUpdates = new Map<number, SlugUpdate>();
  const claimed = new Set<string>();
  let addressChanges = 0;
  const topicSlugCache = new Map<number, Map<string, string> | null>();

  const addressed: { ref: PageRef; topicId: number; placeSlug: string }[] = [
    ...pages
      .filter((page) => finalStatus.get(`#${page.id}`) !== 'retired')
      .map((page) => ({
        ref: { id: page.id } as PageRef,
        topicId: page.topicId,
        placeSlug: page.placeSlug,
      })),
    ...creates.map((create) => ({
      ref: { key: create.key } as PageRef,
      topicId: create.topicId,
      placeSlug: create.placeSlug,
    })),
  ];

  for (const { ref, topicId, placeSlug: place } of addressed) {
    const topic = topicsById.get(topicId);
    if (!topic) continue;
    if (!topicSlugCache.has(topicId)) {
      const computed = topicSlugs(topic, locales, defaultLocale);
      topicSlugCache.set(topicId, computed);
      if (!computed) conflicts.push(`Topic ${topicId} has no slug or name.`);
    }
    const topicSlugMap = topicSlugCache.get(topicId);
    if (!topicSlugMap) continue;

    for (const locale of locales) {
      const path = landingPath(topicSlugMap.get(locale)!, place);
      const pathKey = `${locale}|${path}`;
      const current = currentSlug.get(`${refKey(ref)}|${locale}`);
      if (current?.path === path) {
        claimed.add(pathKey);
        continue;
      }
      if (claimed.has(pathKey)) {
        conflicts.push(`${locale}/${path} is wanted by two pages.`);
        continue;
      }
      const row = slugByPath.get(pathKey);
      const ownsRow = row && 'id' in ref && row.pageId === ref.id;
      if (row && !ownsRow && row.current) {
        const owner = pagesById.get(row.pageId);
        const ownerKeeps =
          owner && finalStatus.get(`#${owner.id}`) !== 'retired';
        if (ownerKeeps) {
          conflicts.push(
            `${locale}/${path} is already page ${row.pageId}'s URL.`,
          );
          continue;
        }
      }
      claimed.add(pathKey);
      // Only a move counts; a new page or language gets its first address.
      if (current) {
        addressChanges++;
        slugUpdates.set(current.id, { id: current.id, current: false });
      }
      if (row) {
        slugUpdates.set(row.id, {
          id: row.id,
          current: true,
          ...(ownsRow ? {} : { page: ref }),
        });
      } else {
        slugInserts.push({ page: ref, locale, path });
      }
    }
  }

  return {
    creates,
    pageUpdates,
    slugInserts,
    slugUpdates: [...slugUpdates.values()],
    conflicts,
    summary: {
      creates: creates.length,
      retires,
      revives,
      unchanged,
      addressChanges,
      redirectsUpdated,
      conflicts: conflicts.length,
    },
  };
}

/**
 * Only the address changes of one topic's existing pages: what a slug edit
 * or translation applies at once, without Apply changes. New, retired and
 * revived pages and address moves between pages wait for Apply changes.
 */
export function topicAddressPlan(
  plan: GenerationPlan,
  input: Pick<PlanInput, 'pages' | 'slugs'>,
  topicId: number,
): GenerationPlan {
  const pageIds = new Set(
    input.pages.filter((page) => page.topicId === topicId).map((p) => p.id),
  );
  const slugPage = new Map(input.slugs.map((slug) => [slug.id, slug.pageId]));
  const ours = (ref: PageRef) => 'id' in ref && pageIds.has(ref.id);
  const slugInserts = plan.slugInserts.filter((insert) => ours(insert.page));
  const slugUpdates = plan.slugUpdates.filter((update) =>
    // A row moved onto one of the topic's pages, or one of its own rows.
    update.page
      ? ours(update.page)
      : pageIds.has(slugPage.get(update.id) ?? -1),
  );
  return {
    creates: [],
    pageUpdates: [],
    slugInserts,
    slugUpdates,
    // Conflicts are shown by the Apply changes preview, which plans them all.
    conflicts: [],
    summary: {
      creates: 0,
      retires: 0,
      revives: 0,
      unchanged: 0,
      // A move: an address that stops being current.
      addressChanges: slugUpdates.filter((update) => !update.current).length,
      redirectsUpdated: 0,
      conflicts: 0,
    },
  };
}
