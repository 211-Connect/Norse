import { PrintableDirectoryDeliveryResponseDto } from '@/lib/api/generated/data-contracts';

export type PrintableDirectoryDeliveryError =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid'
  | 'limit_reached'
  | 'not_found'
  /** "Send to me now" quota used up. */
  | 'rate_limited'
  /** The directory has no resources, so there's nothing to send. */
  | 'empty'
  | 'unknown';

export type PrintableDirectoryDeliveryResult<
  T = PrintableDirectoryDeliveryResponseDto,
> =
  | { success: true; data: T }
  | { success: false; error: PrintableDirectoryDeliveryError };
