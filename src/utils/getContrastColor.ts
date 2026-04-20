export function getContrastColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '');
  const normalizedHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : cleanHex;

  const r = parseInt(normalizedHex.substring(0, 2), 16);
  const g = parseInt(normalizedHex.substring(2, 4), 16);
  const b = parseInt(normalizedHex.substring(4, 6), 16);

  if (
    normalizedHex.length !== 6 ||
    Number.isNaN(r) ||
    Number.isNaN(g) ||
    Number.isNaN(b)
  ) {
    return '#000000';
  }

  const getLinearChannel = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const luminance =
    0.2126 * getLinearChannel(r) +
    0.7152 * getLinearChannel(g) +
    0.0722 * getLinearChannel(b);

  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);

  return contrastWithBlack >= contrastWithWhite ? '#000000' : '#FFFFFF';
}
