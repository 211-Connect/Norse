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

type SearchPageProps = {
  searchParams: Promise<SearchQueryParams>;
  params: Promise<{ locale: string }>;
};

export default async function SearchPage({
  searchParams,
  params,
}: SearchPageProps) {
  const [messages, { data: suggestions }, { data: categories }, queryParams] =
    await Promise.all([
      loadMessages('search'),
      fetchSuggestions(),
      fetchCategories(),
      searchParams,
    ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <NuqsAdapter>
        <SuggestionsProvider value={suggestions}>
          <CategoriesProvider value={categories}>
            <FilterPanelProvider>
              <SearchStoreProvider searchTerm={queryParams.query_label}>
                <ListViewTemplate searchParams={queryParams} params={params} />
              </SearchStoreProvider>
            </FilterPanelProvider>
          </CategoriesProvider>
        </SuggestionsProvider>
      </NuqsAdapter>
    </NextIntlClientProvider>
  );
}
