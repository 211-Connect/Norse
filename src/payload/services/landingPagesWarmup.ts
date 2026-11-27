import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

import {
  LANDING_SEARCH_TTL,
  landingSearch,
} from '@/app/(app)/features/landing-pages/server/landing-search';
import {
  parsePinsQuery,
  toPinsQuery,
} from '@/app/(app)/shared/lib/search-params';
import { findResourcePins } from '@/app/(app)/shared/services/search-pins-service';
import { findResources } from '@/app/(app)/shared/services/search-service';
import { getAppConfigForHost } from '@/app/(app)/shared/utils/appConfig';
import { createLogger } from '@/lib/logger';
import { mapWithLimit } from '@/utilities/mapWithLimit';
import type { LandingPageTopic } from '@/payload/payload-types';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { tenantCanonicalHost } from '@/utils/canonicalHost';

const log = createLogger('landing-pages-warmup');

export const WARM_LANDING_PAGES_TASK = 'warmLandingPages';

/** Searches in flight at once, per run: the Norse API serves visitors too. */
export const WARMUP_CONCURRENCY = 4;

type Db = {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>;
};
const db = (payload: Payload): Db =>
  (payload.db as unknown as { drizzle: Db }).drizzle;

export type WarmupSummary = {
  tenants: number;
  pages: number;
  warmed: number;
  zeroResults: number;
  failed: number;
};

const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' && value !== null ? value.id : value;

/**
 * Warms and counts one tenant's live landing pages (docs/landing-pages.md,
 * "Warm-up and count job"): runs each page's search and map-pins search in
 * the tenant's default locale through the same builder as the page, writing
 * the keys it reads with a fresh 24 h TTL, and saves `resultCount` and
 * `countedAt`. A failing page is logged and skipped. Counts never change a
 * page's status or copy.
 */
export async function warmTenantLandingPages(
  tenantId: string,
): Promise<Omit<WarmupSummary, 'tenants'>> {
  const payload = await getPayloadSingleton();
  const summary = { pages: 0, warmed: 0, zeroResults: 0, failed: 0 };

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
    depth: 0,
  });
  const host = tenantCanonicalHost(tenant);
  const locale = tenant.defaultLocale ?? 'en';
  if (!host) {
    log.warn({ tenantId }, 'Tenant has no trusted domain; nothing warmed');
    return summary;
  }
  const appConfig = await getAppConfigForHost(host, locale);
  if (!appConfig.featureFlags.enableLandingPages) return summary;

  const [{ docs: pages }, { docs: topics }] = await Promise.all([
    payload.find({
      collection: 'landing-pages',
      where: {
        and: [{ tenant: { equals: tenantId } }, { status: { equals: 'live' } }],
      },
      depth: 0,
      pagination: false,
      select: {
        topic: true,
        regionId: true,
        regionType: true,
        regionName: true,
        regionState: true,
      },
    }),
    payload.find({
      collection: 'landing-page-topics',
      where: { tenant: { equals: tenantId } },
      locale: locale as never,
      depth: 0,
      pagination: false,
      trash: true,
    }),
  ]);
  const topicsById = new Map<number, LandingPageTopic>(
    topics.map((topic) => [topic.id, topic]),
  );
  summary.pages = pages.length;

  const { searchEngine, resultsLimit, showAllResultsOnMap } = appConfig.search;
  const cache = { ttl: LANDING_SEARCH_TTL, refresh: true };

  await mapWithLimit(pages, WARMUP_CONCURRENCY, async (page) => {
    const topic = topicsById.get(Number(idOf(page.topic)));
    if (!topic) return;
    try {
      const { query } = await landingSearch(
        appConfig,
        {
          topic: { name: topic.name ?? '', search: topic.search },
          region: {
            id: page.regionId,
            type: page.regionType,
            name: page.regionName,
            state: page.regionState,
          },
        },
        locale,
      );
      const [result] = await Promise.all([
        findResources(query, locale, 1, resultsLimit, tenantId, searchEngine, {
          ...cache,
          record: false,
        }),
        showAllResultsOnMap
          ? findResourcePins(
              parsePinsQuery(toPinsQuery(query, locale, searchEngine)),
              locale,
              tenantId,
              cache,
            )
          : null,
      ]);
      if (!result) throw new Error('Search returned no result');
      // Straight to the table: a Payload update would bump `updatedAt`,
      // which moves the sitemap's `lastmod` and the cache version.
      await db(payload).execute(sql`
        UPDATE lp_pages
        SET
          result_count = ${result.totalResults},
          counted_at = now()
        WHERE
          id = ${page.id}
      `);
      summary.warmed++;
      if (result.totalResults === 0) summary.zeroResults++;
    } catch (err) {
      summary.failed++;
      log.warn(
        { err, tenantId, pageId: page.id },
        'Landing page warm-up failed; skipped',
      );
    }
  });

  log.info({ tenantId, locale, ...summary }, 'Landing pages warmed');
  return summary;
}

/** Every tenant with landing pages on, or the one given. */
export async function warmLandingPages(
  tenantId?: string | null,
): Promise<WarmupSummary> {
  const payload = await getPayloadSingleton();
  let tenantIds: string[];
  if (tenantId) {
    tenantIds = [tenantId];
  } else {
    const { docs } = await payload.find({
      collection: 'resource-directories',
      where: { 'featureFlags.enableLandingPages': { equals: true } },
      depth: 0,
      pagination: false,
      select: { tenant: true },
    });
    tenantIds = [
      ...new Set(
        docs
          .map((doc) => doc.tenant)
          .map((tenant) =>
            typeof tenant === 'object' && tenant !== null ? tenant.id : tenant,
          )
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];
  }

  const total: WarmupSummary = {
    tenants: 0,
    pages: 0,
    warmed: 0,
    zeroResults: 0,
    failed: 0,
  };
  for (const id of tenantIds) {
    try {
      const summary = await warmTenantLandingPages(id);
      total.tenants++;
      total.pages += summary.pages;
      total.warmed += summary.warmed;
      total.zeroResults += summary.zeroResults;
      total.failed += summary.failed;
    } catch (err) {
      log.error(
        { err, tenantId: id },
        'Landing pages warm-up failed for tenant',
      );
    }
  }
  return total;
}
