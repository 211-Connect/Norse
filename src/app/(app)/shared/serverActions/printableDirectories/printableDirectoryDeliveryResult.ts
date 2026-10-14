import { PrintableDirectoryDeliveryResponseDto } from '@/lib/api/generated/data-contracts';

export type PrintableDirectoryDeliveryError =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid'
  | 'limit_reached'
  | 'not_found'
  | 'unknown';

export type PrintableDirectoryDeliveryResult<
  T = PrintableDirectoryDeliveryResponseDto,
> =
  | { success: true; data: T }
  | { success: false; error: PrintableDirectoryDeliveryError };
