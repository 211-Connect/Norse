import { MantineThemeOverride } from '@mantine/core';
import { Open_Sans } from 'next/font/google';
import appTheme from '../../.norse/theme.json';

const openSans = Open_Sans({ subsets: ['latin'] });

export const Theme: MantineThemeOverride = {
  primaryColor: 'primary',
  primaryShade: (appTheme.primaryShade as any) ?? 5,
  other: {
    secondaryShade: (appTheme.secondaryShade as any) ?? 5,
  },
  defaultRadius: 'md',
  fontFamily: openSans.style.fontFamily,
  fontSizes: {
    xs: '14px',
    sm: '16px',
    md: '16px',
    lg: '18px',
    xl: '20px',
  },
  headings: {
    fontFamily: openSans.style.fontFamily,
  },
  colors: {
    primary: (appTheme.primaryPalette as any) ?? [],
    secondary: (appTheme.secondaryPalette as any) ?? [],
    background: ['#EBE9F0'],
  },
  radius: {
    xs: '6px',
    sm: '6px',
    md: '6px',
    lg: '6px',
    xl: '6px',
  },
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
  },
  breakpoints: {
    xs: '576px',
    sm: '768px',
    md: '992px',
    lg: '1200px',
    xl: '1400px',
  },
  globalStyles: (theme) => ({
    body: {
      backgroundColor: theme.colors.background,
    },
    svg: {
      '@media print': {
        color: '#000',
        stroke: '#000',
      },
    },
  }),
  components: {
    ThemeIcon: {
      styles: (theme, params) => ({
        root: {
          border:
            params.variant === 'default'
              ? 'none'
              : theme.colors[params.variant],
          '@media print': {
            boxShadow: 'none',
            border: 'none',
            margin: 0,
            padding: 0,
          },
        },
      }),
    },
    Card: {
      styles: {
        root: {
          overflow: 'initial',
          '@media print': {
            boxShadow: 'none',
            border: 'none',
            margin: 0,
            padding: 0,
          },
        },
      },
    },
    Button: {
      styles: {
        root: {
          '@media print': {
            display: 'none',
          },
        },
      },
    },
    ActionIcon: {
      styles: {
        root: {
          '@media print': {
            display: 'none',
          },
        },
      },
    },
    Anchor: {
      styles: {
        root: {
          color: '#333',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          '@media print': {
            color: '#000',
          },
        },
      },
    },
    NavLink: {
      styles: {
        root: {
          color: '#333',
          '@media print': {
            color: '#000',
          },
        },
      },
    },
    Stack: {
      styles: {
        root: {
          '@media print': {
            maxWidth: '100%',
          },
        },
      },
    },
    Title: {
      styles: {
        root: {
          '@media print': {
            color: '#000',
          },
        },
      },
    },
    Badge: {
      styles: {
        root: {
          color: '#333',
          '@media print': {
            background: 'none',
            color: '#000',
          },
        },
      },
    },
  },
};
