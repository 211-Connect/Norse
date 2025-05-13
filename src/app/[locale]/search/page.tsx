import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { FilterPanel } from '@/features/search/components/filter-panel';
import { MapContainer } from '@/features/search/components/map-container';
import { ResultsSection } from '@/features/search/components/results-section';
import { getSuggestions } from '@/lib/server/get-suggestions';
import { getCategories } from '@/lib/server/get-categories';
import { SuggestionsProvider } from '@/lib/context/suggestions-context';
import { CategoriesProvider } from '@/lib/context/categories-context';

export default async function SearchPage() {
  const { data: suggestions } = await getSuggestions();
  const { data: categories } = await getCategories();

  return (
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
  );
}
