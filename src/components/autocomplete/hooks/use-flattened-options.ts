import { useMemo } from 'react';
import { AutocompleteOptionWithIndex } from '..';

export function useFlattenedOptions(
  options: [string, AutocompleteOptionWithIndex[]][],
) {
  return useMemo(() => {
    return options.flatMap(([, group]) => group);
  }, [options]);
}
