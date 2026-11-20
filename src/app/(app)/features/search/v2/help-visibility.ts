/** Fewer results than this and the floating help control stays hidden (Lucas, 2026-11-18, D1). */
export const HELP_MIN_RESULTS = 4;

/**
 * Whether the floating "Not getting the results you expected?" control hides: while the refine
 * card is on screen, or when the list has fewer than `HELP_MIN_RESULTS` results.
 * `refineRect` is the card's bounding box, or null when no card is on the page.
 */
export function helpControlHidden(input: {
  resultCount: number;
  refineRect: { top: number; bottom: number } | null;
  viewportHeight: number;
}): boolean {
  if (input.resultCount < HELP_MIN_RESULTS) return true;
  const { refineRect: rect, viewportHeight } = input;
  return Boolean(rect && rect.bottom > 0 && rect.top < viewportHeight);
}
