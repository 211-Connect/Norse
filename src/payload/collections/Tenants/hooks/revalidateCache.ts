import { revalidateTag } from 'next/cache';
import { Tenant } from '@/payload/payload-types';

import { byTenantId as byTenantIdResource } from '../../ResourceDirectories/cache/tags';
import { byDomain, byTenantId } from '../cache/tags';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';

export async function revalidateCache({
  doc,
}: {
  doc: Tenant;
}): Promise<Tenant> {
  revalidateTag(byTenantId(doc.id));
  revalidateTag(byTenantIdResource(doc.id));

  doc.trustedDomains.forEach(({ domain }) => {
    const host = parseHost(domain);
    revalidateTag(byDomain(host));
  });
  return doc;
}
