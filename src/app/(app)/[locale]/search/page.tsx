import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { fetchSuggestions } from '@/lib/server/fetch-suggestions';
import { fetchCategories } from '@/lib/server/fetch-categories';
import { SuggestionsProvider } from '@/lib/context/suggestions-context';
import { CategoriesProvider } from '@/lib/context/categories-context';
import { loadMessages } from '@/lib/server/load-messages';
import { NextIntlClientProvider } from 'next-intl';
import { SearchQueryParams } from '@/lib/server/fetch-search-results';
import { ListViewTemplate } from '@/features/search/templates/list-view-template';
import { FilterPanelProvider } from '@/lib/context/filter-panel-context';
import { SearchStoreProvider } from '@/lib/context/search-context/search-store-provider';
import { LocationStoreProvider } from '@/lib/context/location-context/location-store-provider';
import { cookies } from 'next/headers';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/lib/constants';

type SearchPageProps = {
  searchParams: Promise<SearchQueryParams>;
  params: Promise<{ locale: string }>;
};

export default async function SearchPage({
  searchParams,
  params,
}: SearchPageProps) {
  const [
    messages,
    { data: suggestions },
    { data: categories },
    queryParams,
    cookieStore,
  ] = await Promise.all([
    loadMessages('search'),
    fetchSuggestions(),
    fetchCategories(),
    searchParams,
    cookies(),
  ]);

  const location = cookieStore.get(USER_PREF_LOCATION)?.value;
  const coords = cookieStore.get(USER_PREF_COORDS)?.value;

  return (
    <NextIntlClientProvider messages={messages}>
      <NuqsAdapter>
        <SuggestionsProvider value={suggestions}>
          <CategoriesProvider value={categories}>
            <FilterPanelProvider>
              <SearchStoreProvider searchTerm={queryParams.query_label}>
                <LocationStoreProvider
                  searchTerm={queryParams.location || location}
                  userCoords={
                    (queryParams?.coords?.split(',') as unknown as [
                      number,
                      number,
                    ]) ||
                    (coords?.split(',') as unknown as [number, number]) ||
                    undefined
                  }
                >
                  <ListViewTemplate
                    searchParams={queryParams}
                    params={params}
                  />
                </LocationStoreProvider>
              </SearchStoreProvider>
            </FilterPanelProvider>
          </CategoriesProvider>
        </SuggestionsProvider>
      </NuqsAdapter>
    </NextIntlClientProvider>
  );
}
