import type { TypedLocale } from 'payload';

import { buildSearchConfig } from '@/app/(app)/shared/utils/buildSearchConfig';
import type { SearchConfig } from '@/types/search-config';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** The widget's search settings for a tenant, or `null` without a directory. */
export async function getSearchConfig(
  tenantId: string,
  locale: TypedLocale,
): Promise<SearchConfig | null> {
  if (!isCmsRemote()) return buildSearchConfig(tenantId, locale);

  return cmsRequest<SearchConfig | null>('search-config', {
    query: { tenantId, locale },
  });
}
