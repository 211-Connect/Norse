function normalizeHex(hexColor: string): string | null {
  const cleanHex = hexColor.replace('#', '');
  const normalized =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : cleanHex;
  return normalized.length === 6 ? normalized : null;
}

function getLinearChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hexColor: string): number | null {
  const normalized = normalizeHex(hexColor);
  if (!normalized) return null;

  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;

  return (
    0.2126 * getLinearChannel(r) +
    0.7152 * getLinearChannel(g) +
    0.0722 * getLinearChannel(b)
  );
}

/** Returns '#000000' or '#FFFFFF', whichever provides better contrast against the given background. */
export function getContrastColor(hexColor: string): string {
  const luminance = getRelativeLuminance(hexColor);
  if (luminance === null) return '#000000';

  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);

  return contrastWithBlack >= contrastWithWhite ? '#000000' : '#FFFFFF';
}

/**
 * Returns `textColor` if it achieves at least `minRatio` contrast against a
 * white (#ffffff) background (WCAG AA normal text requires 4.5:1). Falls back
 * to '#000000' so the text is always legible on light/white surfaces.
 *
 * Use this for badge styles that render the brand color as foreground text
 * directly on a white or near-white background (e.g. 'light' and 'outline').
 */
export function ensureTextContrastOnWhite(
  textColor: string,
  minRatio = 4.5,
): string {
  const luminance = getRelativeLuminance(textColor);
  if (luminance === null) return '#000000';

  // White has luminance = 1.0; contrast = (1 + 0.05) / (L + 0.05)
  const contrastAgainstWhite = 1.05 / (luminance + 0.05);

  return contrastAgainstWhite >= minRatio ? textColor : '#000000';
}
