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
