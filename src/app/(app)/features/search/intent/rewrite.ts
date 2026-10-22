import { ENVELOPE_KEYS } from './envelope';
import { liftSearchParams, type LiftedSearch } from './lift';
import type { RawSearchParams } from './slot';
import { serializeSearchUrl } from './serialize';
import { SEARCH_SLOTS, type SearchIntent } from './slots';

/** The slot that owns each plain URL key. */
const SLOT_OF_KEY = new Map(
  Object.entries(SEARCH_SLOTS).flatMap(([name, declaration]) =>
    declaration.keys.map((key) => [key, name] as const),
  ),
);
const ENVELOPE = new Set<string>(ENVELOPE_KEYS);

/**
 * The URL the visitor is on, lifted for a writer that edits it (filter navigation, the coords redirect).
 * A recognised plain key repeated in the URL, which the lift would read as nothing, is read as its first
 * value, as the browser's `URLSearchParams.get` and the cookie middleware read it, so the writer keeps it
 * (ISS-2409). A repeat the lift does read (`taxonomy=a&taxonomy=b`) stays as it is, and so do repeated
 * pass-through keys, which the serializer writes back unchanged.
 */
export function liftForRewrite(raw: RawSearchParams): LiftedSearch {
  const lifted = liftSearchParams(raw);
  const collapsed: RawSearchParams = { ...raw };
  let changed = false;
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const slot = SLOT_OF_KEY.get(key);
    const unread = slot
      ? !lifted.intent[slot as keyof typeof lifted.intent].stated
      : ENVELOPE.has(key);
    if (unread) {
      collapsed[key] = value[0];
      changed = true;
    }
  }
  return changed ? liftSearchParams(collapsed) : lifted;
}

/**
 * The `/search` URL for the URL the visitor is on, with a change. `newSearch` drops the page, as a changed
 * search starts on the first page; `basePath` prefixes the path (a locale).
 */
export function rewriteSearchUrl(
  raw: RawSearchParams,
  change: (intent: SearchIntent) => SearchIntent,
  { newSearch, basePath = '' }: { newSearch: boolean; basePath?: string },
): string {
  const { intent, envelope } = liftForRewrite(raw);
  const { page, ...rest } = envelope;
  return serializeSearchUrl(
    change(intent),
    newSearch || page === undefined ? rest : { ...rest, page },
    basePath,
  );
}
