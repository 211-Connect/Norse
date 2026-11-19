import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { getTenantByHost } from '@/lib/cms/tenants';

import { indexableRobotsRules } from './robotsRules';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Resolve the branded tenant for this request host so de-indexing can be
  // controlled per tenant. `robots.txt` is excluded from the middleware
  // matcher, so we look the tenant up directly here.
  const headersList = await headers();
  const host = parseHost(headersList.get('host') ?? '');

  let tenantNoindex = false;
  try {
    const tenant = await getTenantByHost(host);
    tenantNoindex = tenant?.seo?.noindex ?? false;
  } catch {
    // On lookup failure, fall back to the global env gate only.
  }

  // Block all search engines when the global gate blocks indexing (non-prod /
  // not opted in) or this specific tenant has opted out.
  if (shouldBlockCrawlers(tenantNoindex)) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return indexableRobotsRules();
}
