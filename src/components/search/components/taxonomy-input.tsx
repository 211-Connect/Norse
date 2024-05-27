import Autocomplete, { Option } from '@/components/ui/autocomplete';
import useDebounce from '@/lib/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import TaxonomyAdapter, { isTaxonomyCode } from '../adapters/taxonomy-adapter';
import useSuggestions from '@/lib/hooks/use-suggestions';

export default function TaxonomyInput({
  name,
  onChange,
}: {
  name?: string;
  onChange?: (option: Option) => void;
}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const suggestions = useSuggestions();
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value);
  const { data } = useQuery<Option>({
    placeholderData: (prev) => prev,
    queryKey: ['suggestions', debouncedValue, router.locale],
    queryFn: async () => {
      if (!debouncedValue) return null;

      const taxonomyAdapter = TaxonomyAdapter();
      const data = await taxonomyAdapter.searchTaxonomies(
        debouncedValue,
        router.locale
      );

      return {
        group: t('search.taxonomies'),
        items: data?.hits?.hits?.map((tax) => ({
          value: tax?._source?.name,
          term: tax?._source?.code,
          label: tax?._source?.code,
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

  const onValueChange = (option: Option) => {
    onChange?.(option);
    setValue(option.value);
  };

  return (
    <Autocomplete
      name={name}
      className="w-full"
      options={
        filteredData
          ? [filteredSuggestions, filteredData]
          : [filteredSuggestions]
      }
      placeholder={t('search.query_placeholder', {
        ns: 'dynamic',
        defaultValue: t('search.query_placeholder'),
      })}
      defaultValue={
        (router.query?.query_label as string) ??
        (router.query?.query as string) ??
        ''
      }
      onValueChange={onValueChange}
    />
  );
}
