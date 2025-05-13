import color from 'color';

export function getThemeColors(baseColor: string) {
  const baseHslColor = color(baseColor).hsl();
  const hslColor = baseHslColor.array();
  const hslForegroundColor = baseHslColor.isDark() ? '0 0% 100%' : '0 0% 0%';

  return {
    color: `${hslColor[0]} ${hslColor[1]}% ${hslColor[2]}%`,
    foregroundColor: hslForegroundColor,
  };
}
