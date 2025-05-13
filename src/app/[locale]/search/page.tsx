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
