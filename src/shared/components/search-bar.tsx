import { useTranslation } from 'next-i18next';
import { Autocomplete } from './autocomplete';
import { useTaxonomies } from '../hooks/api/use-taxonomies';
import { useAtomValue, useSetAtom } from 'jotai';
import { searchAtom, searchTermAtom } from '../store/search';
import { useDebounce } from '../hooks/use-debounce';
import { useMemo } from 'react';

export function SearchBar() {
  const { t } = useTranslation();
  const setSearch = useSetAtom(searchAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(debouncedSearchTerm);
  const formattedTaxonomies = useMemo(
    () => [
      {
        group: 'Taxonomies',
        items: taxonomies.map((option) => ({ value: option.name })),
      },
    ],
    [taxonomies],
  );

  const setSearchTerm = (value: string) => {
    setSearch((prev) => ({ ...prev, searchTerm: value }));
  };

  return (
    <Autocomplete
      className="search-box"
      placeholder={
        t('search.query_placeholder', {
          ns: 'dynamic',
          defaultValue: t('search.query_placeholder'),
        }) || ''
      }
      options={formattedTaxonomies}
      emptyMessage="Hello, world!"
      onInputChange={setSearchTerm}
      value={searchTerm}
    />
  );
}
