import { revalidateTag } from 'next/cache';
import { ResourceDirectory } from '@/payload/payload-types';
import { byTenantId } from '../cache/tags';

export async function revalidateCache({
  doc,
}: {
  doc: ResourceDirectory;
}): Promise<ResourceDirectory> {
  const tenantId = doc.tenant;
  if (typeof tenantId === 'string') {
    revalidateTag(byTenantId(tenantId));
  }

  return doc;
}
