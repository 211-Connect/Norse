/**
 * Print-time choices shared by the print/share dialogs, the PDF templates
 * and scheduled PDF delivery. Dependency-free on purpose: server code that
 * must not load the PDF renderer imports these.
 */
export const PRINT_VARIANTS = [
  'line-listing',
  'summary-listing',
  'full-listing',
] as const;
export type PrintVariant = (typeof PRINT_VARIANTS)[number];

export const FONT_SIZE_MODES = ['default', 'large'] as const;
export type FontSizeMode = (typeof FONT_SIZE_MODES)[number];
