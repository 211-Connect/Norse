export const DEFAULT_NEED_TITLE = 'What do you need help with?';
export const DEFAULT_NEED_PLACEHOLDER =
  'For example: I think I will run out of food this week.';

/**
 * Pure: the label and placeholder of the v2 need box. The tenant's Payload text wins; the v2
 * default is used only when the tenant field is empty or blank (Lucas 2026-11-20).
 */
export function needBoxTexts(
  texts: { title?: string; queryInputPlaceholder?: string } | undefined,
): { title: string; placeholder: string } {
  return {
    title: texts?.title?.trim() || DEFAULT_NEED_TITLE,
    placeholder:
      texts?.queryInputPlaceholder?.trim() || DEFAULT_NEED_PLACEHOLDER,
  };
}
