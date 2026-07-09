export function getStableKey(
  candidates: Array<string | undefined | null>,
  fallback: string,
): string {
  const stable = candidates.find((candidate) => Boolean(candidate?.trim()));

  return stable || fallback;
}
