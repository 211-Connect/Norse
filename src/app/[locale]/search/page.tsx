import { NuqsAdapter } from 'nuqs/adapters/next/app';
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
import { ListViewTemplate } from '@/features/search/templates/list-view-template';

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
    parsedParams,
  ] = await Promise.all([
    loadMessages('search'),
    fetchSuggestions(),
    fetchCategories(),
    searchParams,
    params,
  ]);

  const { data } = await fetchSearchResults(queryParams, parsedParams?.locale);

  if (!data) {
    throw new Error('Error fetching search results');
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <NuqsAdapter>
        <SuggestionsProvider value={suggestions}>
          <CategoriesProvider value={categories}>
            <ListViewTemplate resultData={data} />
          </CategoriesProvider>
        </SuggestionsProvider>
      </NuqsAdapter>
    </NextIntlClientProvider>
  );
}
