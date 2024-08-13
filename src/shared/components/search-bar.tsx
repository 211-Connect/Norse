import { useTranslation } from 'next-i18next';
import { Autocomplete } from './autocomplete';
import { useTaxonomies } from '../hooks/api/use-taxonomies';
import { useAtomValue, useSetAtom } from 'jotai';
import { searchAtom, searchTermAtom } from '../store/search';
import { useDebounce } from '../hooks/use-debounce';

export function SearchBar() {
  const { t } = useTranslation();
  const setSearch = useSetAtom(searchAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const { data } = useTaxonomies(debouncedSearchTerm);

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
      options={data.map((option) => ({ value: option.name }))}
      emptyMessage="Hello, world!"
      onInputChange={setSearchTerm}
      value={searchTerm}
    />
  );
}
