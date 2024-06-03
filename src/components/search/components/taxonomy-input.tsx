import Autocomplete, { Option } from '@/components/ui/autocomplete';
import useDebounce from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import TaxonomyAdapter, { isTaxonomyCode } from '../adapters/taxonomy-adapter';
import useSuggestions from '../hooks/use-suggestions';

export default function TaxonomyInput({
  name,
  value,
  onInputChange,
  onValueSelect,
}: {
  name?: string;
  value?: string;
  onInputChange?: (value: string) => void;
  onValueSelect?: (option: Option) => void;
}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const suggestions = useSuggestions();
  const debouncedValue = useDebounce(value);
  const { data } = useQuery<Option>({
    placeholderData: (prev) => prev,
    queryKey: ['suggestions', debouncedValue, router.locale],
    queryFn: async () => {
      if (!debouncedValue) return null;

      const taxonomyAdapter = TaxonomyAdapter();
      const data = await taxonomyAdapter.searchTaxonomies(
        debouncedValue,
        router.locale,
      );

      return {
        group: t('search.taxonomies'),
        items: data?.map((tax) => ({
          value: tax?.name,
          term: tax?.code,
          label: tax?.code,
        })),
      };
    },
  });

  const filteredData = useMemo(() => {
    if (!data) return null;

    return {
      group: data?.group,
      items: data?.items?.filter((i) => {
        if (isTaxonomyCode.test(value)) {
          return i?.label?.toLowerCase()?.startsWith(value.toLowerCase());
        } else {
          return i?.value?.toLowerCase()?.includes(value.toLowerCase());
        }
      }),
    };
  }, [data, value]);

  const filteredSuggestions = useMemo(() => {
    return {
      group: t('search.suggestions'),
      items:
        suggestions.filter((s) => {
          if (isTaxonomyCode.test(value)) {
            return s?.term?.toLowerCase()?.startsWith(value.toLowerCase());
          } else {
            return s?.value?.toLowerCase()?.includes(value.toLowerCase());
          }
        }) ?? [],
    };
  }, [suggestions, value, t]);

  return (
    <Autocomplete
      name={name}
      className="w-full"
      value={value}
      options={
        filteredData
          ? [filteredSuggestions, filteredData]
          : [filteredSuggestions]
      }
      placeholder={t('search.query_placeholder')}
      onInputChange={onInputChange}
      onValueSelect={onValueSelect}
    />
  );
}
