'use server';

import { getResources } from '@/app/(app)/shared/services/resource-service';
import { resourcesToPrintableDirectory } from '@/app/(app)/shared/utils/printable-directory-transformers';
import { protectAction } from '@/lib/arcjet-page';

/**
 * Data for a printable directory of search results. Callable by anyone who
 * has the action ID (it is in the JS bundle), so it is protected like a page:
 * Arcjet first (`route=print`), and the tenant comes from the request host,
 * never from the client.
 *
 * `tenantId` is kept for compatibility with existing clients and ignored.
 * No ID cap yet (next release): `ids_requested`/`ids_unique` in the
 * `arcjet_decision` record will show real sizes. See docs/bot-protection.md.
 *
 * Returns `null` when the request is denied on an enforced host; the print
 * dialog shows its friendly "could not load" message. Never throws for a
 * denial.
 */
export async function getPrintableDirectoryData(
  resourceIds: string[],
  locale: string,
  _clientTenantId: string,
  listName: string,
) {
  const ids = Array.isArray(resourceIds) ? resourceIds : [];
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  const { denied, tenantId } = await protectAction({
    route: 'print',
    path: `/${encodeURIComponent(locale)}/search`,
    idsRequested: ids.length,
    idsUnique: uniqueIds.length,
  });
  if (denied || !tenantId) return null;

  if (uniqueIds.length === 0) {
    return { name: listName, items: [] };
  }

  const resources = await getResources(uniqueIds, locale, tenantId);
  return resourcesToPrintableDirectory(resources, locale, listName);
}
