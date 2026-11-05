import type { TypedLocale } from 'payload';

import type { SearchConfig } from '@/types/search-config';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** The widget's search settings for a tenant, or `null` without a directory. */
export async function getSearchConfig(
  tenantId: string,
  locale: TypedLocale,
): Promise<SearchConfig | null> {
  // Dropped from the public app's build (see ./tenants.ts).
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { buildSearchConfig } =
        await import('@/app/(app)/shared/utils/buildSearchConfig');
      return buildSearchConfig(tenantId, locale);
    }
  }

  return cmsRequest<SearchConfig | null>('search-config', {
    query: { tenantId, locale },
  });
}
