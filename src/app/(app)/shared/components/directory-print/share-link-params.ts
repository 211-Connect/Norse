import {
  FONT_SIZE_MODES,
  PRINT_VARIANTS,
  type FontSizeMode,
  type PrintVariant,
} from './pdf-print-primitives';

/**
 * Query param keys shared between the share dialog (which writes them into
 * the generated share link) and the public download dialog (which reads
 * them back out) so the recipient's PDF matches what the sharer configured.
 */
export const PD_VARIANT_PARAM = 'pdVariant';
export const PD_FONT_SIZE_PARAM = 'pdFontSize';
export const PD_SLUG_PARAM = 'pdSlug';

export function parsePrintVariantParam(
  value: string | null,
): PrintVariant | null {
  return value && (PRINT_VARIANTS as readonly string[]).includes(value)
    ? (value as PrintVariant)
    : null;
}

export function parseFontSizeModeParam(
  value: string | null,
): FontSizeMode | null {
  return value && (FONT_SIZE_MODES as readonly string[]).includes(value)
    ? (value as FontSizeMode)
    : null;
}
