/**
 * The words the search box shows for a page URL.
 * v1 shows `query_label` only. A link with `query` and no `query_label` (v2 links, a reload) shows its words
 * only when the tenant's v2 switch (`enableV2Api`) is on, so a v1 tenant sees the same box as before v2.
 */
export function searchTermFromUrl({
  query,
  queryLabel,
  queryType,
  v2,
}: {
  query: string;
  queryLabel: string;
  queryType: string;
  v2: boolean;
}): string {
  if (queryLabel) return queryLabel;
  if (!v2) return '';
  return queryType === 'text' || queryType === 'hybrid' || !queryType
    ? query
    : '';
}
