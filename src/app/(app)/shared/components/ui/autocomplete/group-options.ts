import {
  AutocompleteOption,
  AutocompleteOptionGroup,
  IndexedAutocompleteOption,
} from './types';

/**
 * Groups options by `group`, keeping groups in order of first appearance,
 * and numbers them in that display order. `flatOptions[i]` is the option
 * shown i-th, so keyboard navigation always follows what's on screen, even
 * when the caller's list interleaves groups.
 */
export function groupAutocompleteOptions(options: AutocompleteOption[]): {
  groups: AutocompleteOptionGroup[];
  flatOptions: IndexedAutocompleteOption[];
} {
  const groupsByName = new Map<string | undefined, AutocompleteOption[]>();

  for (const option of options) {
    const groupOptions = groupsByName.get(option.group);
    if (groupOptions) {
      groupOptions.push(option);
    } else {
      groupsByName.set(option.group, [option]);
    }
  }

  const groups: AutocompleteOptionGroup[] = [];
  const flatOptions: IndexedAutocompleteOption[] = [];

  for (const [name, groupOptions] of groupsByName) {
    const indexed = groupOptions.map((option, position) => ({
      ...option,
      index: flatOptions.length + position,
    }));
    flatOptions.push(...indexed);
    groups.push({ name, options: indexed });
  }

  return { groups, flatOptions };
}
