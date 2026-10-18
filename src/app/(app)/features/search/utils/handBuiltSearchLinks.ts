import qs from 'qs';

import { PRINTABLE_DIRECTORY_CONTEXT_PARAMS } from '@/app/(app)/shared/utils/printableDirectorySearchContext';

// The /search links that still build their own URL instead of going through the search-intent serializer.
// Each keeps its exact bytes today: the serializer would encode spaces as `+`, trim, derive `query_type` or
// reorder stored parameters. tests/search-intent-hand-built-links.test.ts proves each lifts to the intent
// it means; a new /search URL outside these, the serializer and the listed raw paths fails
// tests/search-url-writers.test.ts.

/** A home topic card's subtopic. Untrimmed values are preserved until ISS-2407. */
export function topicSearchHref(
  query: string | null | undefined,
  label: string,
  queryType: string | null | undefined,
): string {
  return `/search?query=${encodeURIComponent(
    query ?? '',
  )}&query_label=${encodeURIComponent(
    label,
  )}&query_type=${encodeURIComponent(queryType ?? '')}`;
}

/** A taxonomy badge on a resource page. */
export function categorySearchHref(code: string, name: string): string {
  return `/search?query=${encodeURIComponent(
    code,
  )}&query_label=${encodeURIComponent(name)}&query_type=taxonomy`;
}

/**
 * A printable-directory source: its stored search parameters, replayed in their saved order, plus the
 * directory context. The source id makes Save on the search page update this source instead of adding one.
 */
export function directorySourceSearchHref(
  params: Record<string, unknown>,
  directoryId: string,
  sectionId: string,
  sourceId: string,
): string {
  return `/search?${qs.stringify(
    {
      ...params,
      [PRINTABLE_DIRECTORY_CONTEXT_PARAMS.directoryId]: directoryId,
      [PRINTABLE_DIRECTORY_CONTEXT_PARAMS.sectionId]: sectionId,
      [PRINTABLE_DIRECTORY_CONTEXT_PARAMS.sourceId]: sourceId,
    },
    { arrayFormat: 'indices', encodeValuesOnly: true },
  )}`;
}
