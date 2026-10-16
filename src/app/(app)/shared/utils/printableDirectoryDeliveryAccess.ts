import { TEST_SENDS_PER_HOUR } from '@/app/(app)/features/printable-directories/utils/scheduledDelivery';
import { cacheService } from '@/cacheService';

import { getApiErrorStatus } from './printableDirectoryServerAccess';
import {
  getPrintableDirectoryServerAccess,
  PrintableDirectoryServerAccess,
} from './printableDirectoryServerAccess';
import { PrintableDirectoryDeliveryError } from '../serverActions/printableDirectories/printableDirectoryDeliveryResult';

/**
 * Server-only access check for scheduled PDF delivery actions: basic
 * printable directory access plus the `scheduledPdfDelivery` capability.
 * Edit access to the directory itself is enforced by the Norse API.
 */
export async function getScheduledDeliveryAccess(
  tenantId: string,
): Promise<
  | { access: PrintableDirectoryServerAccess; error?: never }
  | { access?: never; error: PrintableDirectoryDeliveryError }
> {
  const access = await getPrintableDirectoryServerAccess(tenantId);

  if (!access) {
    return { error: 'unauthorized' };
  }
  if (!access.hasCapability('scheduledPdfDelivery')) {
    return { error: 'forbidden' };
  }

  return { access };
}

export function toDeliveryError(
  error: unknown,
): PrintableDirectoryDeliveryError {
  switch (getApiErrorStatus(error)) {
    case 400:
      return 'invalid';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'limit_reached';
    default:
      return 'unknown';
  }
}

const ONE_HOUR_SECONDS = 60 * 60;
const memoryTestSendCounts = new Map<string, number>();

/**
 * Counts one "Send to me now" against the user's hourly quota; false once
 * it's used up. Redis-backed so the quota holds across instances, with an
 * in-process fallback when Redis is unavailable.
 */
export async function consumeTestSendQuota(
  tenantId: string,
  userEmail: string,
): Promise<boolean> {
  const hour = Math.floor(Date.now() / (ONE_HOUR_SECONDS * 1000));
  const key = `pd-test-send:${tenantId}:${userEmail.toLowerCase()}:${hour}`;

  let count = await cacheService.incrementWithTtl(key, ONE_HOUR_SECONDS);
  if (count === null) {
    count = (memoryTestSendCounts.get(key) ?? 0) + 1;
    memoryTestSendCounts.set(key, count);
    for (const staleKey of memoryTestSendCounts.keys()) {
      if (!staleKey.endsWith(`:${hour}`)) memoryTestSendCounts.delete(staleKey);
    }
  }

  return count <= TEST_SENDS_PER_HOUR;
}
