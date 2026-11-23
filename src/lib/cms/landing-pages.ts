import type {
  LandingResolution,
  LandingSitemap,
} from '@/app/(app)/features/landing-pages/lib/types';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/**
 * Landing pages from the CMS (docs/landing-pages.md). In-process when this
 * build runs Payload, else over the CMS internal API.
 */

/** What a landing-page path (`topic/place`, no leading slash) answers. */
export async function resolveLandingPage(
  tenantId: string,
  locale: string,
  path: string,
): Promise<LandingResolution> {
  // Dropped from the public app's build (see ./tenants.ts).
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const service = await import('@/payload/services/landingPages');
      return service.resolveLandingPage(tenantId, locale, path);
    }
  }
  return cmsRequest<LandingResolution>('landing-pages/resolve', {
    query: { tenantId, locale, path },
  });
}

/** Every live page with its paths per locale, for the sitemaps. */
export async function listLandingSitemap(
  tenantId: string,
): Promise<LandingSitemap> {
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const service = await import('@/payload/services/landingPages');
      return service.listLandingSitemap(tenantId);
    }
  }
  return cmsRequest<LandingSitemap>('landing-pages/sitemap', {
    query: { tenantId },
    timeoutMs: 15_000,
  });
}

/** Changes whenever the tenant's landing pages change; part of cache keys. */
export async function getLandingPagesVersion(
  tenantId: string,
): Promise<string> {
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const service = await import('@/payload/services/landingPages');
      return service.getLandingPagesVersion(tenantId);
    }
  }
  return cmsRequest<string>('landing-pages/version', { query: { tenantId } });
}
