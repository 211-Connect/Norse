import { useAppConfig } from '../../../lib/hooks/useAppConfig';
import { Autocomplete, AutocompleteProps } from '@mantine/core';
import { useDebouncedValue, useInputState, useToggle } from '@mantine/hooks';
import { RefAttributes, useEffect, useMemo, useRef, useState } from 'react';
import { Loader } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { AutoCompleteItem } from './AutocompleteItem';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { TaxonomyAdapter } from '../../../lib/adapters/TaxonomyAdapter';

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
  const { suggestions: unformattedSuggestions } = useAppConfig();
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
    [unformattedSuggestions, t]
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
      hiddenQueryTypeInput.current.value = valueInSuggestions
        ? 'taxonomy'
        : 'text';
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
    if (debounced.length < 2) return;

    (async function () {
      const query = new URLSearchParams();
      query.set('query', debounced);

      toggle(true);

      const taxonomyAdapter = new TaxonomyAdapter();
      const data = await taxonomyAdapter.getTaxonomySuggestions(debounced, {
        locale: router.locale,
      });

      toggle(false);

      setElasticSuggestions(data);
    })();
  }, [debounced, toggle, router]);

  useEffect(() => {
    function routeChangeCompleteHandler(e: any) {
      const queryParams = e.split('?')[1];
      const searchParams = new URLSearchParams(queryParams);
      const query = searchParams.get('query');
      const queryLabel = searchParams.get('query_label');

      if (queryLabel && queryLabel.length > 0) {
        setValue(queryLabel || '');
      } else if (query && query !== value) {
        setValue(query || '');
      }
    }

    router.events.on('routeChangeComplete', routeChangeCompleteHandler);

    return () => {
      router.events.off('routeChangeComplete', routeChangeCompleteHandler);
    };
  }, [router.events, value, setValue]);

  return (
    <>
      <Autocomplete
        {...rest}
        aria-label={
          (t('search.query_placeholder') as string) ||
          (t('search.query_placeholder', { ns: 'dynamic' }) as string) ||
          ''
        }
        icon={<IconSearch />}
        placeholder={
          (t('search.query_placeholder') as string) ||
          (t('search.query_placeholder', { ns: 'dynamic' }) as string) ||
          ''
        }
        data={computedSuggestions}
        value={value}
        onChange={handleOnChange}
        onItemSubmit={handleItemSubmit}
        itemComponent={AutoCompleteItem}
        rightSection={isLoading && <Loader size="sm" />}
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
