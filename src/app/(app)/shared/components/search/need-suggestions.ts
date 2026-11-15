/** Short phrases get suggestions. A sentence gets out of the way. */
export const SUGGESTION_MAX_WORDS = 3;

/**
 * Pure: the suggestions for what is typed. The local list (tenant suggestions and topic names)
 * comes first, then the names the real suggestions API returned. A match must contain the typed
 * text and differ from it. At most 5 are kept.
 */
export function pickNeedSuggestions(
  text: string,
  local: string[],
  remote: string[] = [],
): string[] {
  const typed = text.trim().toLowerCase();
  if (!typed || typed.split(/\s+/).length > SUGGESTION_MAX_WORDS) return [];
  const seen = new Set<string>();
  return [...local, ...remote]
    .filter((value) => {
      const low = value.toLowerCase();
      if (!low.includes(typed) || low === typed || seen.has(low)) return false;
      seen.add(low);
      return true;
    })
    .slice(0, 5);
}
