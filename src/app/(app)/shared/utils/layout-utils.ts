export interface ComponentWithSeparatorInfo {
  element: React.ReactElement;
  isSeparator: boolean;
}

/**
 * Cleans up an array of rendered components by removing:
 * - Leading separators
 * - Trailing separators
 * - Consecutive separators
 */
export function cleanSeparators<T extends ComponentWithSeparatorInfo>(
  components: T[],
): T[] {
  return components.filter((item, index) => {
    if (!item.isSeparator) {
      return true;
    }

    // Remove leading separator
    if (index === 0) {
      return false;
    }

    // Remove trailing separator
    if (index === components.length - 1) {
      return false;
    }

    // Remove consecutive separators
    const nextItem = components[index + 1];
    if (nextItem && nextItem.isSeparator) {
      return false;
    }

    return true;
  });
}
