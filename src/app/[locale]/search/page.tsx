import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { FilterPanel } from '@/features/search/components/filter-panel';
import { MapContainer } from '@/features/search/components/map-container';
import { ResultsSection } from '@/features/search/components/results-section';
import { fetchSuggestions } from '@/lib/server/fetch-suggestions';
import { fetchCategories } from '@/lib/server/fetch-categories';
import { SuggestionsProvider } from '@/lib/context/suggestions-context';
import { CategoriesProvider } from '@/lib/context/categories-context';
import { loadMessages } from '@/lib/server/load-messages';
import { NextIntlClientProvider } from 'next-intl';
import {
  fetchSearchResults,
  SearchQueryParams,
} from '@/lib/server/fetch-search-results';

type SearchPageProps = {
  params: Promise<SearchQueryParams>;
};

export default async function SearchPage({ params }: SearchPageProps) {
  const [messages, { data: suggestions }, { data: categories }, searchParams] =
    await Promise.all([
      loadMessages('search'),
      fetchSuggestions(),
      fetchCategories(),
      params,
    ]);

  const { data } = await fetchSearchResults(searchParams, searchParams?.locale);

  return (
    <NextIntlClientProvider messages={messages}>
      <NuqsAdapter>
        <SuggestionsProvider value={suggestions}>
          <CategoriesProvider value={categories}>
            <div className="flex h-full w-full">
              {/* <FilterPanel /> */}
              <ResultsSection />
              <MapContainer />
            </div>
          </CategoriesProvider>
        </SuggestionsProvider>
      </NuqsAdapter>
    </NextIntlClientProvider>
  );
}
