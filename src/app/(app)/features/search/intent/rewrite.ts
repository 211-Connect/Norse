import { liftSearchParams } from './lift';
import type { RawSearchParams } from './slot';
import { serializeSearchUrl } from './serialize';
import type { SearchIntent } from './slots';

/**
 * The `/search` URL for the URL the visitor is on, with a change (filter navigation, the coords redirect).
 * It is lifted like any URL, so a repeated or bracketed plain key is written back as the first value the
 * page read (ISS-2409, ISS-2472). `newSearch` drops the page, as a changed search starts on the first page;
 * `basePath` prefixes the path (a locale).
 */
export function rewriteSearchUrl(
  raw: RawSearchParams,
  change: (intent: SearchIntent) => SearchIntent,
  { newSearch, basePath = '' }: { newSearch: boolean; basePath?: string },
): string {
  const { intent, envelope } = liftSearchParams(raw);
  const { page, ...rest } = envelope;
  return serializeSearchUrl(
    change(intent),
    newSearch || page === undefined ? rest : { ...rest, page },
    basePath,
  );
}
