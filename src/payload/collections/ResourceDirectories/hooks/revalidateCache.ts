import { ResourceDirectory } from '@/payload/payload-types';
import { findByTenantId } from '../../Tenants/services/findByTenantId';
import { getPayload } from 'payload';
import config from '@/payload/payload-config';
import { cacheService } from '@/cacheService';
import { createCacheKey } from '../cache/keys';

export async function revalidateCache({
  doc,
  req,
}): Promise<ResourceDirectory> {
  const tenantId = doc.tenant;
  const locale = new URL(req.url).searchParams.get('locale');

  if (typeof tenantId === 'string' && locale) {
    try {
      const payload = await getPayload({ config });
      const tenant = await findByTenantId(payload, tenantId);

      if (tenant) {
        const cacheKeys = tenant.trustedDomains.map(({ domain }) =>
          createCacheKey(locale, domain),
        );
        const cacheServiceInstance = cacheService();
        await Promise.all(
          cacheKeys.map((key) => cacheServiceInstance.del(key)),
        );
      }
    } catch {}
  }

  return doc;
}
