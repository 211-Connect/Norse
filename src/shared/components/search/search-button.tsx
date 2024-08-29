import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Button } from '../ui/button';
import { SearchService } from '../../services/search-service';
import { useAtomValue } from 'jotai';
import { searchAtom } from '../../store/search';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useTaxonomies } from '@/shared/hooks/api/use-taxonomies';
import { useSuggestions } from '@/shared/hooks/use-suggestions';

export function SearchButton() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const search = useAtomValue(searchAtom);
  const debouncedSearchTerm = useDebounce(search.searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(debouncedSearchTerm);
  const suggestions = useSuggestions();

  // Find the taxonomy code to be used for a query
  // Fallback to the original string value if a code isn't found
  const findCode = (value: string) => {
    const taxonomy = taxonomies.find(
      (tax) => tax.name.toLowerCase() === value.toLowerCase(),
    );
    if (taxonomy) return taxonomy.code;

    const suggestion = suggestions.find(
      (sugg) => sugg.name.toLowerCase() === value.toLowerCase(),
    );
    if (suggestion) return suggestion.taxonomies;

    return value;
  };

  const getQueryType = (value, query) => {
    if (query.trim().length === 0) return '';
    if (query === value) return 'text';
    return 'taxonomy';
  };

  const onClick = async () => {
    const query = findCode(search.searchTerm);
    const queryType = getQueryType(search.searchTerm, query);

    const urlParams = SearchService.createUrlParamsForSearch({
      ...search,
      query,
      queryType,
    });

    await router.push({
      pathname: '/search',
      query: urlParams,
    });
  };

  return <Button onClick={onClick}>{t('call_to_action.search')}</Button>;
}
