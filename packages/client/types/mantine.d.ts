import { Tuple, DefaultMantineColor } from '@mantine/core';

type ExtendedCustomColors =
  | 'primary'
  | 'secondary'
  | 'background'
  | DefaultMantineColor;

declare module '@mantine/core' {
  export interface MantineThemeOther {
    secondaryShade: number;
  }

  export interface MantineThemeColorsOverride {
    colors: Record<ExtendedCustomColors, Tuple<string, 10>>;
  }
}
