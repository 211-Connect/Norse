import type { AppConfig } from '@/types/appConfig';

export const DEFAULT_BRAND_THEME = {
  primaryColor: '#005191',
  secondaryColor: '#FFB351',
  borderRadius: '6px',
} as const;

export const DEFAULT_HEADER_GRADIENT = {
  start: '#ffffff',
  end: '#ffffff',
} as const;

export const DEFAULT_BADGE_COLOR = '#0044B5';
export const ACCESSIBLE_TOUR_ACCENT = '#005ea2';

export const ANALYTICS_TREND_COLORS = {
  positive: '#15803d',
  negative: '#dc2626',
} as const;

export function resolveBrandTheme(
  theme?: AppConfig['brand']['theme'],
): Required<AppConfig['brand']['theme']> {
  return {
    primaryColor: theme?.primaryColor ?? DEFAULT_BRAND_THEME.primaryColor,
    secondaryColor: theme?.secondaryColor ?? DEFAULT_BRAND_THEME.secondaryColor,
    borderRadius: theme?.borderRadius ?? DEFAULT_BRAND_THEME.borderRadius,
  };
}

export function resolveHeaderGradient(
  newLayout?: AppConfig['newLayout'],
): { headerStart: string; headerEnd: string } {
  return {
    headerStart: newLayout?.headerStart ?? DEFAULT_HEADER_GRADIENT.start,
    headerEnd: newLayout?.headerEnd ?? DEFAULT_HEADER_GRADIENT.end,
  };
}
