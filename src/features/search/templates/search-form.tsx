import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { AddressBar } from '../components/address-bar';
import { SearchBar } from '../components/search-bar';
import { useSearchStore } from '@/lib/context/search-context/search-store-provider';
import { getSearchQuery } from '@/lib/context/search-context/get-search-query';
import { useCategories } from '@/lib/context/categories-context';
import { useSuggestions } from '@/lib/context/suggestions-context';
import { useTaxonomies } from '../components/search-bar/hooks/use-taxonomies';
import { useRouter } from '@/i18n/navigation';

export function SearchForm() {
  const t = useTranslations('common');
  const searchTerm = useSearchStore((store) => store.searchTerm);
  const categories = useCategories();
  const suggestions = useSuggestions();
  const { data: taxonomies } = useTaxonomies();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { query, queryLabel, queryType } = getSearchQuery(searchTerm, {
      categories,
      suggestions,
      taxonomies,
    });

    router.push({
      pathname: '/search',
      query: {
        query,
        query_label: queryLabel,
        query_type: queryType,
      },
    });
  };

  return (
    <form className="w-full space-y-2" onSubmit={handleSubmit}>
      <SearchBar />
      <AddressBar />
      <div className="flex justify-end">
        <Button>{t('search.search')}</Button>
      </div>
    </form>
  );
}
