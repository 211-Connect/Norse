import { PrintableDirectoryHeaderFooterDto } from '@/lib/api/generated/data-contracts';

export type LayoutItem = NonNullable<
  PrintableDirectoryHeaderFooterDto['layout']
>[number];

export const LAYOUT_ITEMS: LayoutItem[] = ['logo', 'text', 'domain', 'date'];

export const DEFAULT_MAX_RESOURCES = 100;
