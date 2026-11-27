import { cache } from 'react';

import {
  getLandingPagesVersion,
  listLandingSitemap,
  resolveLandingPage,
} from '@/lib/cms/landing-pages';
import {
  ONE_DAY,
  ONE_MINUTE,
  stableHash,
  withCache,
} from '@/utilities/withCache';

import type { LandingResolution, LandingSitemap } from '../lib/types';

/**
 * Landing-page data for the public app, cached (docs/landing-pages.md,
 * "Caching"). The version changes on any change to the tenant's topics,
 * pages or URLs; it is read from memory for a minute, and every other key
 * includes it, so an edit reaches the pages within a minute.
 */

export const getLandingVersion = cache(
  async (tenantId: string): Promise<string> =>
    (await withCache(
      `landing_version:${tenantId}`,
      () => getLandingPagesVersion(tenantId),
      { redis: false, memory: true, ttl: ONE_MINUTE },
    )) ?? 'unknown',
);

/** What `topic/place` answers for the tenant in the locale. */
export const getLandingResolution = cache(
  async (
    tenantId: string,
    locale: string,
    path: string,
  ): Promise<LandingResolution> => {
    const version = await getLandingVersion(tenantId);
    const resolution = await withCache(
      `landing_page:${tenantId}:${locale}:${stableHash({ version, path })}`,
      () => resolveLandingPage(tenantId, locale, path),
      { redis: true, memory: true, ttl: ONE_DAY },
    );
    return resolution ?? { kind: 'not-found' };
  },
);

/** Every live page with its paths per locale (the hub, the sitemaps). */
export const getLandingSitemap = cache(
  async (tenantId: string): Promise<LandingSitemap> => {
    const version = await getLandingVersion(tenantId);
    const sitemap = await withCache(
      `landing_sitemap:${tenantId}:${stableHash({ version })}`,
      () => listLandingSitemap(tenantId),
      { redis: true, memory: true, ttl: ONE_DAY },
    );
    return sitemap ?? { topics: {}, entries: [] };
  },
);
