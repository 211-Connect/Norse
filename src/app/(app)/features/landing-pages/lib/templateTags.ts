/**
 * Copy templates hold tags such as `{topic}` and `{location}`
 * (docs/landing-pages.md, docs/template-tags.md) that machine translation
 * must not touch. Mask them before translating, then put them back.
 */

const TAG = /\{[a-zA-Z]+\}/g;
// Translation engines sometimes drop an `@` or `_` or add spaces inside the
// sentinel (seen with Amharic: `@__T1__@@`), so restoring is lenient.
const SENTINEL = /@{1,2}\s*_{1,2}\s*T\s*(\d+)\s*_{1,2}\s*@{1,2}/g;

export type MaskedTemplate = { text: string; tags: string[] };

export function maskTemplateTags(text: string): MaskedTemplate {
  const tags: string[] = [];
  const masked = text.replace(TAG, (tag) => `@@__T${tags.push(tag) - 1}__@@`);
  return { text: masked, tags };
}

/**
 * Restores the tags in a translated text. A tag the translation dropped is
 * appended, so the page never loses a variable silently.
 */
export function unmaskTemplateTags(translated: string, tags: string[]): string {
  const used = new Set<number>();
  const restored = translated.replace(SENTINEL, (match, raw) => {
    const index = Number(raw);
    if (tags[index] === undefined) return match;
    used.add(index);
    return tags[index];
  });
  const missing = tags.filter((_, index) => !used.has(index));
  return missing.length
    ? `${restored.trimEnd()} ${missing.join(' ')}`
    : restored;
}
