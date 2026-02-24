import * as React from 'react';
import { type LucideIcon } from 'lucide-react';
import { createLogger } from '@/lib/logger';

const log = createLogger('useIconComponent');
import {
  SUPPORTED_ICONS,
  type SupportedIconName,
} from '@/utils/supportedIcons';

/**
 * Returns a Lucide icon component by name from the supported icons list.
 * Only icons defined in SUPPORTED_ICONS can be used, ensuring controlled bundle size.
 *
 * @param iconName - The name of the Lucide icon
 * @returns The icon component or null if not found
 */
export function useIconComponent(
  iconName: string | null | undefined,
): LucideIcon | null {
  return React.useMemo(() => {
    if (!iconName) {
      return null;
    }

    const icon = SUPPORTED_ICONS[iconName as SupportedIconName];

    if (!icon) {
      log.warn(
        { iconName },
        'Icon is not in the supported icons list; only icons from SUPPORTED_ICONS can be used',
      );
      return null;
    }

    return icon;
  }, [iconName]);
}
