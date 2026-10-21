/**
 * URL params that put the search page into "printable directory" context —
 * the user came from a directory's "Go to search results" button and Save
 * should target that directory's section (and source, when editing one).
 * See docs/printable-directories.md ("Search page directory context").
 */
export const PRINTABLE_DIRECTORY_CONTEXT_PARAMS = {
  directoryId: 'pdid',
  sectionId: 'pdsid',
  sourceId: 'pdsrcid',
} as const;

const CONTEXT_PARAM_KEYS = Object.values(PRINTABLE_DIRECTORY_CONTEXT_PARAMS);

/**
 * Copies the context params from the current URL onto a freshly built
 * search URL, so starting a new search (which rebuilds the URL from scratch)
 * doesn't silently drop the directory the user is editing.
 */
export function withPrintableDirectoryContext(
  url: string,
  currentParams: Pick<URLSearchParams, 'get'> | null,
): string {
  const [path, query = ''] = url.split('?');
  const params = new URLSearchParams(query);

  CONTEXT_PARAM_KEYS.forEach((key) => {
    const value = currentParams?.get(key);
    if (value) params.set(key, value);
  });

  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}

/** The current search params without the context params. */
export function withoutPrintableDirectoryContext(
  searchParams: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  CONTEXT_PARAM_KEYS.forEach((key) => next.delete(key));
  return next;
}
