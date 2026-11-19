/**
 * The `&amp;` crawl trap (ISS-2307). An outside crawler reads React's correctly escaped `href="…&amp;page=2"`
 * without decoding the entity, so it requests `?…&amp;page=2` and the key arrives as `amp;page`. Writers that
 * copied the current URL then added one `amp;` level per hop. No Norse writer emits such a key and no
 * reader recognises one, so a URL carrying it is never a real search.
 *
 * HTML entity names are matched case-insensitively here because `&AMP;` is also a valid entity.
 */
const CRAWL_TRAP_KEY = /^amp;/i;

export function isCrawlTrapKey(key: string): boolean {
  return CRAWL_TRAP_KEY.test(key);
}

export function hasCrawlTrapKey(params: URLSearchParams): boolean {
  for (const key of params.keys()) {
    if (isCrawlTrapKey(key)) return true;
  }
  return false;
}

/** Every pair except crawl-trap keys, in order, repeats included. */
export function withoutCrawlTrapKeys(params: URLSearchParams): URLSearchParams {
  return new URLSearchParams(
    [...params.entries()].filter(([key]) => !isCrawlTrapKey(key)),
  );
}
