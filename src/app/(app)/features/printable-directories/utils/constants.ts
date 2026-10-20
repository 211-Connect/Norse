import { PrintableDirectoryHeaderFooterDto } from '@/lib/api/generated/data-contracts';

export type LayoutItem = NonNullable<
  PrintableDirectoryHeaderFooterDto['layout']
>[number];

export const LAYOUT_ITEMS: LayoutItem[] = ['logo', 'text', 'domain', 'date'];

export const DEFAULT_MAX_RESOURCES = 100;

/**
 * Max length of each localized value, matching the Norse API's validation
 * (`MaxLocalizedValueLength`). Keeps auto-translation cost bounded; see
 * docs/translation-usage.md.
 */
export const DIRECTORY_SHORT_TEXT_MAX_LENGTH = 200;
export const DIRECTORY_LONG_TEXT_MAX_LENGTH = 2000;

/**
 * Query param keys that carry the searcher's current location. These
 * override a printable directory's own `defaultQueryConfig` when saved as
 * part of a query source.
 */
export const LOCATION_QUERY_PARAM_KEYS = new Set([
  'coords',
  'location',
  'distance',
]);
