import { useMemo } from 'react';
import { AutocompleteOptionWithIndex } from '..';

export function useGroupedOptions(options) {
  return useMemo<[string, AutocompleteOptionWithIndex[]][]>(() => {
    const rawOptions = options ?? [];
    if (rawOptions.length === 0) return [];

    let index = 0;

    const grouped: Record<string, AutocompleteOptionWithIndex[]> = rawOptions
      .slice()
      .sort((a, b) => {
        const groupA = a.group?.toUpperCase() ?? '';
        const groupB = b.group?.toUpperCase() ?? '';
        return groupA.localeCompare(groupB);
      })
      .reduce(
        (acc, option) => {
          const group = option.group ?? '_';
          acc[group] ??= [];

          const { group: _, ...rest } = option;
          acc[group].push({ ...rest, index });

          index++;
          return acc;
        },
        {} as Record<string, AutocompleteOptionWithIndex[]>,
      );

    return Object.entries(grouped);
  }, [options]);
}
