'use client';
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
import { omitNullish } from '@/utils/omit-nullish';
import { useLocationStore } from '@/lib/context/location-context/location-store-provider';
import { getLocationQuery } from '@/lib/context/location-context/get-location-query';
import { useAddresses } from '../components/address-bar/hooks/use-addresses';

export function SearchForm() {
  const t = useTranslations('common');
  const router = useRouter();
  const searchTerm = useSearchStore((store) => store.searchTerm);
  const locationSearchTerm = useLocationStore((store) => store.searchTerm);
  const categories = useCategories();
  const suggestions = useSuggestions();
  const { data: taxonomies } = useTaxonomies();
  const { data: addresses } = useAddresses();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { query, queryLabel, queryType } = getSearchQuery(searchTerm, {
      categories,
      suggestions,
      taxonomies,
    });

    const { location, coords, distance } = getLocationQuery(
      locationSearchTerm,
      { addresses },
    );

    const queryParams = omitNullish({
      query,
      query_label: queryLabel,
      query_type: queryType,
      location,
      coords,
      distance,
    });

    router.push({
      pathname: '/search',
      query: queryParams,
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
