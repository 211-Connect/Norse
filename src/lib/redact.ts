/**
 * Helpers that keep secrets out of log lines. No Node-only imports: used by
 * the proxy and by `FetchError`, which also runs in the browser.
 */

const VISIBLE_CHARS = 4;
const MIN_MASKABLE_LENGTH = VISIBLE_CHARS * 3;

/** Query parameters whose values are masked by `redactUrl`. */
const SECRET_QUERY_PARAMS = ['secret', 'token', 'api_key', 'apikey', 'key'];

/**
 * `abcdEFGH…wxyz` → `abcd…wxyz`: the first and last 4 characters, enough to
 * tell which secret was used without revealing it. Short values are fully
 * masked, since 8 visible characters would be most of them.
 */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length < MIN_MASKABLE_LENGTH) return '***';
  return `${value.slice(0, VISIBLE_CHARS)}…${value.slice(-VISIBLE_CHARS)}`;
}

/** `url` with the values of secret-looking query parameters masked. */
export function redactUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  let changed = false;
  for (const name of SECRET_QUERY_PARAMS) {
    const value = parsed.searchParams.get(name);
    if (value) {
      parsed.searchParams.set(name, maskSecret(value));
      changed = true;
    }
  }

  return changed ? parsed.toString() : url;
}
