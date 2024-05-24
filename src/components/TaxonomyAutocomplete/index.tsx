import { ActionIcon, Autocomplete, AutocompleteProps } from '@mantine/core';
import { useDebouncedValue, useInputState, useToggle } from '@mantine/hooks';
import { RefAttributes, useEffect, useMemo, useRef, useState } from 'react';
import { Loader } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { AutoCompleteItem } from './AutocompleteItem';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { TaxonomyAdapter } from '@/lib/adapters/TaxonomyAdapter';
import unformattedSuggestions from '../../../.norse/suggestions.json';
import { isTaxonomyCode } from '@/lib/constants/regex';

type Props = Partial<AutocompleteProps> &
  RefAttributes<HTMLInputElement> & {
    defaultQuery: string;
    defaultQueryLabel: string;
    defaultQueryType: string;
  };

export function TaxonomyAutocomplete({
  defaultQuery,
  defaultQueryLabel,
  defaultQueryType,
  ...rest
}: Props) {
  const hiddenQueryInput = useRef<HTMLInputElement>(null);
  const hiddenQueryLabelInput = useRef<HTMLInputElement>(null);
  const hiddenQueryTypeInput = useRef<HTMLInputElement>(null);
  const [value, setValue] = useInputState(rest?.defaultValue ?? '');
  const [isLoading, toggle] = useToggle([false, true]);
  const [debounced] = useDebouncedValue(value, 200);
  const [elasticSuggestions, setElasticSuggestions] = useState<any[]>([]);
  const router = useRouter();
  const { t } = useTranslation('common');
  const suggestions = useMemo(
    () =>
      unformattedSuggestions.map((el: any, key: number) => ({
        ...el,
        value: t(`suggestions.${key}`, {
          defaultValue: el.value,
          ns: 'dynamic',
        }),
        group: t('search.suggestions'),
        group_label: 'Suggestions',
      })),
    [t]
  );

  // Create an array that includes both our static suggestions AND elasticsearch suggestion
  const computedSuggestions = [...suggestions, ...elasticSuggestions];

  const handleOnChange = (value: string) => {
    setValue(value);

    const valueInSuggestions = computedSuggestions.find(
      (el) => el.value.toLowerCase() === value.toLowerCase()
    );

    if (hiddenQueryInput.current) {
      hiddenQueryInput.current.value = valueInSuggestions
        ? valueInSuggestions.term
        : value;
    }

    if (hiddenQueryLabelInput.current) {
      hiddenQueryLabelInput.current.value = valueInSuggestions
        ? valueInSuggestions.value
        : value;
    }

    if (hiddenQueryTypeInput.current) {
      hiddenQueryTypeInput.current.value =
        valueInSuggestions || isTaxonomyCode.test(value) ? 'taxonomy' : 'text';
    }
  };

  const handleItemSubmit = (e: any) => {
    if (hiddenQueryInput.current) {
      hiddenQueryInput.current.value = e.term;
    }

    if (hiddenQueryLabelInput.current) {
      hiddenQueryLabelInput.current.value = e.value;
    }

    if (hiddenQueryTypeInput.current) {
      hiddenQueryTypeInput.current.value = 'taxonomy';
    }
  };

  useEffect(() => {
    (async function () {
      const taxonomyAdapter = new TaxonomyAdapter();

      let data;
      if (isTaxonomyCode.test(debounced)) {
        toggle(true);
        data = await taxonomyAdapter.getTaxonomySuggestionsByCode(debounced);
      } else if (debounced.length > 2) {
        toggle(true);
        data = await taxonomyAdapter.getTaxonomySuggestions(debounced);
      } else {
        return;
      }

      toggle(false);
      setElasticSuggestions(data);
    })();
  }, [debounced, toggle]);

  return (
    <>
      <Autocomplete
        {...rest}
        aria-label={
          t('search.query_placeholder', {
            ns: 'dynamic',
            defaultValue: t('search.query_placeholder'),
          }) || ''
        }
        icon={<IconSearch />}
        placeholder={
          t('search.query_placeholder', {
            ns: 'dynamic',
            defaultValue: t('search.query_placeholder'),
          }) || ''
        }
        filter={(value, item) => {
          if (isTaxonomyCode.test(value)) {
            return item?.term?.toLowerCase()?.startsWith(value.toLowerCase());
          } else {
            return item?.value?.toLowerCase()?.includes(value.toLowerCase());
          }
        }}
        data={computedSuggestions}
        value={value}
        onChange={handleOnChange}
        onItemSubmit={handleItemSubmit}
        itemComponent={AutoCompleteItem}
        rightSection={
          isLoading ? (
            <Loader size="sm" />
          ) : (
            value.length > 0 && (
              <ActionIcon onClick={() => handleOnChange('')}>
                <IconX />
              </ActionIcon>
            )
          )
        }
        limit={25}
        maxDropdownHeight={300}
      />
      <input
        hidden
        name="query"
        ref={hiddenQueryInput}
        defaultValue={defaultQuery}
      />
      <input
        hidden
        name="query_label"
        ref={hiddenQueryLabelInput}
        defaultValue={defaultQueryLabel}
      />
      <input
        hidden
        name="query_type"
        ref={hiddenQueryTypeInput}
        defaultValue={defaultQueryType}
      />
    </>
  );
}
