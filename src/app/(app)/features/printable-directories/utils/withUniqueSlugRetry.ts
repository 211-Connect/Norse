/**
 * Retries an async mutation with a new, collision-avoiding slug whenever it
 * reports `error: 'slug_taken'`, per the printable directory creation wizard
 * spec (see docs/printable-directories.md — "A.I. Creation wizard"): a
 * title is slugified by default, and a collision appends a random 4-digit
 * suffix rather than surfacing an error to the user.
 *
 * `attempt` is called with each candidate slug in turn. Any result other
 * than `{ success: false, error: 'slug_taken' }` is returned immediately.
 */
export async function withUniqueSlugRetry<
  TResult extends { success: boolean; error?: string },
>(
  baseSlug: string,
  attempt: (slug: string) => Promise<TResult>,
  maxAttempts: number = 5,
): Promise<TResult> {
  let candidate = baseSlug;
  let result = await attempt(candidate);

  for (
    let attemptsRemaining = maxAttempts - 1;
    !result.success && result.error === 'slug_taken' && attemptsRemaining > 0;
    attemptsRemaining--
  ) {
    const fourDigitSuffix = String(Math.floor(1000 + Math.random() * 9000));
    candidate = `${baseSlug}-${fourDigitSuffix}`;
    result = await attempt(candidate);
  }

  return result;
}
