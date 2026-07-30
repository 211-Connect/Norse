import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

export type PrintableDirectoryMutationResult =
  | { success: true; data: PrintableDirectoryResponseDto }
  | { success: false; error: 'slug_taken' | 'unknown' };
